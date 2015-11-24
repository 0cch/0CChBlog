---
author: admin
comments: true
date: 2015-11-24 23:43:26+00:00
layout: post
slug: 'gotcha-sdk'
title: gotcha sdk 全盘文件名搜索开发库
categories:
- NTInternals
---

想必大家都知道著名的全盘搜索工具everything，它极速的搜索速度让人眼前一亮。虽然everything提供了SDK，但是SDK是通过IPC的方式，获得everything程序里的数据。也就是说想在自己的程序中使用搜索功能那么必须带everything的主程序，这就是我开发gotcha sdk的主要原因，他能集成到程序当中，不需要依赖其他主程序，只需要你的程序是管理员权限运行，因为这样才能直接访问磁盘数据。另外网上也有一些关于everything原理和实现的代码，但是大部分都有问题，比如崩溃，死锁，内存占用过高等，并不适合直接用到产品当中。而gotcha sdk在自己开发了everything_study，并且使用了相当长的时间，解决性能，内存占用，死锁等问题的基础上提炼出来的开发库，我对其稳定性还是比较有信心的。

利用gotcha sdk，既可以开发出everything_study这样用C++写的程序，也能够开发出如gotcha sdk的sample里的gotcha，一个C#编写的全盘搜索程序，该程序也展示了gotcha sdk的用法。

gotcha sdk的用法非常简单，详细情况可以参考sample里的simple例子，该例子展示了sdk最简单的使用方式，我下一篇blog会介绍这套sdk的用法。

[![20151124233627](/uploads/2015/11/20151124233627.png)](/uploads/2015/11/20151124233627.png)

gotcha sdk 代码SVN:
[http://code.taobao.org/svn/gotcha_sdk/](http://code.taobao.org/svn/gotcha_sdk/)

