---
author: admin
comments: true
layout: post
slug: 'tensorflow-install'
title: TensorFlow pip安装（非GPU版）
date: 2017-11-26 17:11:10
categories:
- DeepLearner
---

TensorFlow安装有很多种方法，其中用dock安装是最方便的方式，源代码编译是最麻烦但是最能切合自己机器CPU的方法，当然了，你也可以用Anacaonda安装（一个科学计算的工具合集，以后有机会再介绍）。不过这次，我将介绍使用pip安装的方法。我个人认为这种方法其实是众多方法中最简单方便的方法了（系统基于ubuntu 16.04）。

先来说说常规用pip安装的方法：
```
pip3 install --upgrade tensorflow
```
首先当然是安装tensorflow框架了（当然你得有python，如果没有可以使用apt-get install python3-pip python3-dev来安装）

接下来就是安装temsorflow了
```
pip3 install tensorflow     # Python 3.n; CPU support (no GPU support)
```
如果你的电脑和系统的配置正常，这个时候应该可以正常使用tensorflow了。不过，在我的电脑上出现了这么一个警告：
```
Your CPU supports instructions that this TensorFlow binary was not compiled to use: SSE4.1 SSE4.2 AVX AVX2 FMA
```
很明显，现代CPU支持折现特性已经很常见了，但是框架版本并不支持。难道真的要便宜一个么？（据我测试2G内存的机器是无法编译tensorflow的）。于是物品翻阅了github，发现以及有人走在前面，在 https://github.com/mind/wheels 里有很多已经编译的模块提供ubuntu。比如，在我的平台上适合的版本是
```
https://github.com/mind/wheels/releases/download/tf1.4-cpu/tensorflow-1.4.0-cp35-cp35m-linux_x86_64.whl
```
那么就可以使用这个版本来安装tensorflow：
```
pip --no-cache-dir install https://github.com/mind/wheels/releases/download/tf1.4-cpu/tensorflow-1.4.0-cp35-cp35m-linux_x86_64.whl
```