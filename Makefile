NAME=Noiseclapper
DOMAIN=JordanViknar

.PHONY: all pack install clean

all: dist/extension.js

node_modules: package.json
	npm install

dist/extension.js dist/prefs.js: node_modules
	tsc

schemas/gschemas.compiled: schemas/org.gnome.shell.extensions.$(NAME).gschema.xml
	glib-compile-schemas schemas

dist/prefs.ui: ui/prefs.blp
	blueprint-compiler compile ui/prefs.blp > dist/prefs.ui

$(NAME)@$(DOMAIN).zip: dist/extension.js dist/prefs.js schemas/gschemas.compiled dist/prefs.ui
	@cp -r schemas dist/
	@cp metadata.json dist/
	@(cd dist && zip ../$(NAME)@$(DOMAIN).zip -9r .)

pack: $(NAME)@$(DOMAIN).zip

install: $(NAME)@$(DOMAIN).zip
#	@touch ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)
#	@rm -rf ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)
#	@mv dist ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)
	gnome-extensions install $(NAME)@$(DOMAIN).zip --force

clean:
	@rm -rf dist $(NAME)@$(DOMAIN).zip