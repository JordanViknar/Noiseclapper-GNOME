# Noiseclapper (Soundcore Life for GNOME)

![License](https://img.shields.io/github/license/JordanViknar/Noiseclapper?color=green&label=license%2C%20GPL%20being%20GPL%2C%20it%27s)
![Top language](https://img.shields.io/github/languages/top/JordanViknar/Noiseclapper?color=yellow)
![Commit activity](https://img.shields.io/github/commit-activity/m/JordanViknar/Noiseclapper?color=orange)
![Repo size](https://img.shields.io/github/repo-size/JordanViknar/Noiseclapper)

## Disclaimer
This is an **unofficial** GNOME Shell extension, designed for use with the Soundcore Life Q30 headphones (although it may work with other Soundcore headphones). 
I am **not** partnered with Soundcore or Anker in any way. Although I am using his API, [KillerBOSS2019](https://github.com/KillerBOSS2019) is **not** involved with the development of this extension.

## What is Noiseclapper ?

Noiseclapper is a GNOME Shell extension that allows you to control some settings in your Soundcore Life headphones. Normally, the official way of doing this would be to use the [official Android application](https://play.google.com/store/apps/details?id=com.oceanwing.soundcore) through your smartphone, and then set the Active Noise Cancellation mode and the Equalizer settings from there. Problem : the application is **exclusive to Android**.

So what do you do when you're using a computer ?

Well, officially, you're supposed to use the NC button or "pet" the right side of the headphones to change those settings. Again, there is a problem : you cannot choose the Active Noise Cancellation mode you want to use, and the Equalizer settings are nowhere to be seen.

Alternatively, you could use the [SoundcoreDesktop application](https://github.com/KillerBOSS2019/SoundcoreLifeAPI) to modify those settings, but I find it unpractical to use.

This extension is meant to be a solution to all these issues. On top of having all the pros of being a GNOME Shell extension (no interface to clutter your active windows, easy to access), it also provides Linux support for the control of Soundcore Life headphones, on both Wayland and X11, including the current Active Noise Cancellation mode and the current Equalizer preset used.

## Supported Devices
| Soundcore Life Devices | Support |
| ---- | ---- |
| Life Q35 | ? |
| Life Q30 | ✓ |
| Life Q20+ | ? |
| Life Q20 | ? |
| Life Q10 | Partial ? |

If your device works despite not being marked as supported, don't hesitate to create an issue or a pull request. *(I suppose the Q10 is not fully supported because it seems to lack Active Noise Cancelling.)*

## Requirements

- GNOME Shell
- Python 3
- Bluetooth support on the computer
- *(The Soundcore application must be inactive on your phone, else it will conflict for the control of your headphones with this extension.)*

You do not need SoundCoreLifeAPI. This extension comes bundled with its own version of SoundCoreLifeAPI, modified slightly to fit Noiseclapper.

## Bug Reports / Contributions / Suggestions
You can report bugs or suggest features by making an issue, or you can contribute to this extension directly by forking it and then sending a pull request. Any help will be very much appreciated. Thank you !

[Badge Issues]: https://img.shields.io/github/issues/JordanViknar/Noiseclapper
[Badge Pull Requests]: https://img.shields.io/github/issues-pr/JordanViknar/Noiseclapper
[Badge Language]: https://img.shields.io/github/languages/top/JordanViknar/Noiseclapper
[Badge License]: https://img.shields.io/github/license/JordanViknar/Noiseclapper
[Badge Lines]: https://img.shields.io/tokei/lines/github/JordanViknar/Noiseclapper
