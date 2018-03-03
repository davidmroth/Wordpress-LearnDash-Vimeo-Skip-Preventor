#!/bin/bash

PLUGIN_NAME=LearnDash_Vimeo_Skip_Preventor

test -e ../${PLUGIN_NAME}.zip && rm ../${PLUGIN_NAME}.zip
zip -r ../${PLUGIN_NAME}.zip *.php js/ css/
