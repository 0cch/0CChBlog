---
author: admin
comments: true
date: 2013-01-20 09:17:01+00:00
layout: post
slug: dia_study-pdb%e6%9f%a5%e7%9c%8b%e5%b7%a5%e5%85%b7
title: Dia_study —— PDB查看工具
wordpress_id: 130
categories:
- Debugging
---

没事在家翻代码，发现大半年前的一份代码，写的是一个调用DIA SDK查看PDB文件的小工具。仔细想想我觉得还有点用处，而且使用方式简单，所以现在就发到blog上来吧。

简单介绍一下这个小工具。它可以dump出pdb的函数和数据结构的信息。下面两张图分别dump的是数据结构和函数的信息。

图一中，命令行为 dia_study.exe -p xxx.pdb -n *processor* -t 其实 -p是指pdb路径，-n是要获得的符号（支持通配符），-t说明要看的是数据结构而不是函数。然后所有带有processor的数据结构就会dump出来了。

[![20130120165712](/uploads/2013/01/20130120165712.png)](/uploads/2013/01/20130120165712.png)

图二中，命令行为 dia_study.exe -p xxx.pdb -n *processor* -f 唯一的区别就是-t变成了-f。指明要dump的是函数而非数据结构。

[![20130120165737](/uploads/2013/01/20130120165737.png)](/uploads/2013/01/20130120165737.png)



ok，使用方式就是如此简单。注意一点，请自备vs2010的c runtime 以及 msdia100.dll（需要注册），否则程序无法运行。

下载 [dia_study](/uploads/2013/01/dia_study.zip)
