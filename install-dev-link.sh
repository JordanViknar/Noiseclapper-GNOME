#!/bin/bash

#This will install the extension by directly making a symbolic link in the GNOME Shell Extensions user folder.
#This is mainly intended for development, and it will not remove unecessary files, nor make a release zip.
#Consider it as a developer alternative to make-release-version.sh

ln -s $(pwd)/Noiseclapper@JordanViknar ~/.local/share/gnome-shell/extensions/Noiseclapper@JordanViknar
