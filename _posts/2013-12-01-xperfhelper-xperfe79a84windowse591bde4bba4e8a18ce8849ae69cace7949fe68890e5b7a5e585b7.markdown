---
author: admin
comments: true
date: 2013-12-01 14:25:52+00:00
layout: post
slug: xperfhelper-xperf%e7%9a%84windows%e5%91%bd%e4%bb%a4%e8%a1%8c%e8%84%9a%e6%9c%ac%e7%94%9f%e6%88%90%e5%b7%a5%e5%85%b7
title: XPerfHelper —— XPerf的Windows命令行脚本生成工具
wordpress_id: 384
categories:
- Debugging
---

使用过XPerf的应该都知道，写一个XPerf的命令行是多么的麻烦，如果不太熟悉，需要反复的查看帮助里的参数。所以一般情况下，大家会把命令写到一个cmd或者bat的脚本中，这样就可以双击来使用XPerf，只需要第一次费点心思写脚本罢了。但是我还是觉得，即使是只用写一次脚本，也还是挺麻烦的，于是写了这个小工具，生成cmd脚本文件。妈妈再也不用担心我的XPerf命令写错了。

[![20131201221223](/uploads/2013/12/20131201221223.png)](/uploads/2013/12/20131201221223.png)

如上图所示，我们可以选择kernel flag和stackwalk，然后选择providers，点击OK，生成cmd文件即可。下面是一个生成的cmd的内容：

[![20131201222315](/uploads/2013/12/20131201222315.png)](/uploads/2013/12/20131201222315.png)



下载[XPerfHelper](/uploads/2013/12/XPerfHelper.zip)
