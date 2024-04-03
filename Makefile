NAME=Noiseclapper
DOMAIN=JordanViknar

.PHONY: all pack install clean translation

all: dist/extension.js

# Dependencies
node_modules: package.json
	npm install

# JS files
dist/extension.js dist/prefs.js dist/indicator.js dist/utilities.js: node_modules
	tsc

# Locale generation (reminder that Poedit is used to generate the mo and po files)
locale/Noiseclapper.pot: src/extension.ts src/prefs.ts src/indicator.ts src/utilities.ts
	xgettext --from-code=UTF-8 --output=locale/Noiseclapper.pot src/extension.ts src/prefs.ts src/indicator.ts src/utilities.ts ui/prefs.blp --add-comments --keyword=_ --keyword=C_:1c,2
translation: locale/Noiseclapper.pot

# Schemas
schemas/gschemas.compiled: schemas/org.gnome.shell.extensions.$(NAME).gschema.xml
	glib-compile-schemas schemas

# UI
dist/prefs.ui: ui/prefs.blp
	blueprint-compiler compile ui/prefs.blp > dist/prefs.ui

# Zip file
$(NAME)@$(DOMAIN).zip: dist/extension.js dist/prefs.js dist/indicator.js dist/utilities.js schemas/gschemas.compiled dist/prefs.ui
	@cp -r locale dist/
	@cp -r schemas dist/
	@cp metadata.json dist/
	@(cd dist && zip ../$(NAME)@$(DOMAIN).zip -9r . --exclude=locale/\*.pot --exclude=locale/\*.po --exclude=schemas/\*.compiled --exclude=\*.blp)

pack: $(NAME)@$(DOMAIN).zip

install: $(NAME)@$(DOMAIN).zip
	gnome-extensions install $(NAME)@$(DOMAIN).zip --force

clean:
	@rm -rf dist $(NAME)@$(DOMAIN).zip