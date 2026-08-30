#!/usr/bin/env bash
set -euo pipefail

PREFIX=${1:?usage: build-sdl3-image.sh INSTALL_PREFIX}
SDL_IMAGE_VERSION=3.4.4
SDL_IMAGE_SHA256=b0c11bbde540e26d1cedf31174349fe6ab67e57658efe22e16e75172859c817d
WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

# Populate Emscripten's SDL3 CMake package before SDL_image configures itself.
emcc --use-port=sdl3 -x c /dev/null -c -o "$WORK_DIR/prime-sdl3.o"

curl --fail --location --retry 3 \
    "https://github.com/libsdl-org/SDL_image/archive/refs/tags/release-${SDL_IMAGE_VERSION}.tar.gz" \
    --output "$WORK_DIR/sdl-image.tar.gz"
SDL_IMAGE_ACTUAL_SHA256=$(sha256sum "$WORK_DIR/sdl-image.tar.gz" | awk '{ print $1 }')
test "$SDL_IMAGE_ACTUAL_SHA256" = "$SDL_IMAGE_SHA256"
mkdir "$WORK_DIR/source"
tar -xzf "$WORK_DIR/sdl-image.tar.gz" -C "$WORK_DIR/source" --strip-components=1

# Emscripten's experimental SDL3 port has a CMake config but no version config.
# SDL_image performs its own target version check immediately afterward.
perl -pi -e 's/find_package\(SDL3 \$\{SDL_REQUIRED_VERSION\} REQUIRED/find_package(SDL3 REQUIRED/' \
    "$WORK_DIR/source/CMakeLists.txt"

emcmake cmake -S "$WORK_DIR/source" -B "$WORK_DIR/build" \
    -G Ninja \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_INSTALL_PREFIX="$PREFIX" \
    -DCMAKE_PREFIX_PATH="$EMSDK/upstream/emscripten/cache/sysroot" \
    -DBUILD_SHARED_LIBS=OFF \
    -DSDLIMAGE_INSTALL=ON \
    -DSDLIMAGE_SAMPLES=OFF \
    -DSDLIMAGE_TESTS=OFF \
    -DSDLIMAGE_DEPS_SHARED=OFF \
    -DSDLIMAGE_VENDORED=ON \
    -DSDLIMAGE_BACKEND_STB=ON \
    -DSDLIMAGE_AVIF=OFF \
    -DSDLIMAGE_BMP=ON \
    -DSDLIMAGE_GIF=OFF \
    -DSDLIMAGE_JPG=ON \
    -DSDLIMAGE_JXL=OFF \
    -DSDLIMAGE_LBM=OFF \
    -DSDLIMAGE_PCX=OFF \
    -DSDLIMAGE_PNG=ON \
    -DSDLIMAGE_PNG_LIBPNG=OFF \
    -DSDLIMAGE_PNM=OFF \
    -DSDLIMAGE_QOI=OFF \
    -DSDLIMAGE_SVG=OFF \
    -DSDLIMAGE_TGA=OFF \
    -DSDLIMAGE_TIF=OFF \
    -DSDLIMAGE_WEBP=OFF \
    -DSDLIMAGE_XCF=OFF \
    -DSDLIMAGE_XPM=OFF \
    -DSDLIMAGE_XV=OFF
cmake --build "$WORK_DIR/build" --parallel
cmake --install "$WORK_DIR/build"
