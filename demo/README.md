Add some images to `images/` directory within folders. The structure should look like this:

* images/foo/bar.jpg
* images/foo/baz.jpg

The build script (`build.sh`) will use those and `templates/` to generate `out/`.

In addition you need to remember to symlink images to `out/` like this:

1. cd out/
2. ln -s ../images images

In case you want to see the result, consider using `serve` Node.js module. Install it first using `npm install serve -g` and invoke `serve out/` at `demo/` after that. You should be able to see a gallery at `localhost:3000` now.
