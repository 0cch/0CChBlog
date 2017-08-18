---
author: admin
comments: true
date: 2017-07-02 15:56:54+00:00
layout: post
slug: 'gotcha-sdk-monitor-update'
title: gotcha sdk 文件监控功能更新
categories:
- NTInternals
---

在15年的一篇blog中，我介绍了gotcha sdk。{% post_link gotcha-sdk %}


当时gotcha sdk没有提供文件监控功能，也就是说当搜索文件发生变化的时候，这个变化不会体现到搜索结果列表中。其实这个功能一直在todo list中，只不过忙的时候没时间写这部分代码，闲的时候又忘了。前几天终于有时间把这部分代码补上，升级了sdk。


gotcha sdk 代码SVN:
[http://code.taobao.org/svn/gotcha_sdk/](http://code.taobao.org/svn/gotcha_sdk/)