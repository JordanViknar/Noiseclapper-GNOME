# Variables
NAME = Noiseclapper
DOMAIN = JordanViknar
DIST_DIR = dist
LOCALE_DIR = locale
SCHEMA_DIR = schemas
UI_DIR = ui

SOURCE_FILES = src/extension.ts src/prefs.ts src/indicator.ts src/common.ts
JS_FILES = $(DIST_DIR)/extension.js $(DIST_DIR)/prefs.js $(DIST_DIR)/indicator.js $(DIST_DIR)/common.js
UI_FILES = $(UI_DIR)/prefs.blp

# Phony targets
.PHONY: all pack install clean locale

# Default target
all: $(JS_FILES)

# Dependencies
node_modules: package.json
	npm install
	touch $@

# Check TypeScript files with xo
check:
	npx xo

# Compile TypeScript files
$(DIST_DIR)/%.js: $(SOURCE_FILES) node_modules
	tsc

# Generate pot file for translation
$(LOCALE_DIR)/$(NAME).pot: $(SOURCE_FILES) $(UI_FILES)
	xgettext --from-code=UTF-8 --output=$@ $^ --add-comments --keyword=_ --keyword=C_:1c,2 --language=JavaScript
locale: $(LOCALE_DIR)/$(NAME).pot

# Compile schema files
# $(SCHEMA_DIR)/gschemas.compiled: $(SCHEMA_DIR)/org.gnome.shell.extensions.$(NAME).gschema.xml
#	glib-compile-schemas $(SCHEMA_DIR)

# Compile UI files
$(DIST_DIR)/prefs.ui: $(UI_FILES)
	blueprint-compiler compile $^ > $@

# Pack extension
$(NAME)@$(DOMAIN).zip: $(JS_FILES) $(DIST_DIR)/prefs.ui $(LOCALE_DIR)/$(NAME).pot
	cp -r locale dist/
	cp -r schemas dist/
	cp metadata.json dist/
	cd dist && zip ../$(NAME)@$(DOMAIN).zip -9r . --exclude=locale/\*.pot --exclude=locale/\*.po --exclude=\*.blp

pack: $(NAME)@$(DOMAIN).zip

install: $(NAME)@$(DOMAIN).zip
	gnome-extensions install $< --force

clean:
	rm -rf $(DIST_DIR) $(NAME)@$(DOMAIN).zip
