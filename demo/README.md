Add some images to `images/` directory within folders. The structure should look like this:

* images/foo/bar.jpg
* images/foo/baz.jpg

The build script (`build.sh`) will use those and `templates/` to generate `out/`.

In addition you need to remember to symlink images to `out/` like this:

1. cd out/
2. ln -s ../images images
