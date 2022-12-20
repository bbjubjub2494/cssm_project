const mix = require('laravel-mix');

mix.js('frontend/Model.js', './Model.js')
    .setPublicPath('.')
    .options({ manifest: false });
