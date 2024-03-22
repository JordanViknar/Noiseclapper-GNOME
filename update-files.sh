cd Noiseclapper@JordanViknar
glib-compile-schemas schemas
blueprint-compiler compile prefs.blp > prefs.ui
xgettext --from-code=UTF-8 --output=locale/Noiseclapper.pot *.js *.ui
cd ..
