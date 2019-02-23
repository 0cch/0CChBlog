---
author: admin
comments: true
layout: post
slug: 'compile gcc in windows'
title: 在Windows中编译GCC
date: 2019-02-22 19:00:12
categories:
- Tips
---
最近心血来潮想体验下C++2a的标准，但是mingw中的GCC最新版本是8.2。于是乎就产生了编译thunk下最新代码。

要在Windows上编译GCC没有在linux上方便，但是也是可以完成的。首先我们需要一个mingw的环境。自带mingw环境的软件有很多，这里我比较推荐MSYS2，因为这个环境更新的比较快。下载安装好了以后，运行MSYS2，会弹出类似linux终端窗口。这里我们首先下载需要的开发编译环境：
> pacman -S --needed mingw-w64-i686-toolchain mingw-w64-x86_64-toolchain

下载安装好了开发环境后，可以下载GCC源代码：
> mkdir gcc-latest
> cd gcc-latest
> git clone git://gcc.gnu.org/git/gcc.git

源代码比较大（2个多G），下载需要一点耐心。
源代码下载完成后，创建编译目录：
> mkdir build

在开始编译之前，有一个坑需要注意下，我们需要将usr/bin/下的makeinfo改名。不知道为什么，最新的makeinfo对gcc的texi文件不兼容会导致编译失败。这个操作之后就可以开始配置了。
> ../gcc/configure --enable-languages=c,c++ --disable-multilib --disable-bootstrap --disable-werror --disable-nls --prefix=/mingw64/gcc-latest --build=x86_64-w64-mingw32 --host=x86_64-w64-mingw32 --target=x86_64-w64-mingw32 --with-native-system-header-dir=/mingw64/x86_64-w64-mingw32/include --with-arch=x86-64 MAKEINFO=missing
> export LIBRARY_PATH=/mingw64/x86_64-w64-mingw32/lib

配置的选项比较多，我们可以参考GCC文档进行参照。这里的配置是我尝试后感觉必须加入的，否则编译的时候会出相应的问题。可以说是编译GCC血泪史了。
再然后就可以开始编译了：
> make -j 16

使用多线程编译，编译速度会快不少。编译好了以后就可以安装了，注意安装的时候可能会遇到失败，需要注释build/gcc/makefile中，对应s-tm-texi的相关代码。
> make install

最后检查gcc版本号：
> gcc -v

注意目前最新的版本号为9.0.1。
