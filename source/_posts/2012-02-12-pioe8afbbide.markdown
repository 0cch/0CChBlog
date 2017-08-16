---
author: admin
comments: true
date: 2012-02-12 07:26:09+00:00
layout: post
slug: pio%e8%af%bbide
title: PIO读IDE
wordpress_id: 76
categories:
- MiniKernel
tags:
- IDE
- Kernel
- MiniKernel
- OS
- PIO
---

[![](/uploads/2012/02/read.jpg)](/uploads/2012/02/read.jpg)

经过各种代码的东拼西凑、改来改去，总算是把PIO读取硬盘信息的代码“写”好了，上图是读取硬盘的前512字节的效果图。目前看来还是很挫，原因有两点：

1.只支持LBA48的读取方法，不支持CHS，LBA28，虽然这两个方法的读取范围很有限，但是感觉至少要把LBA28给支持了才行。  
2.很郁闷的一点，这个读取代码读取成功了，但是IO后返回的状态值是错误的。不知道哪里出了问题，会不会是虚拟硬盘太小而不能用LBA48的问题呢？没有头绪。  

--------

补充1.通过IDENTIFY DEVICE命令发现，可能由于设置的虚拟硬盘比较小的原因，虚拟硬盘不支持48bit的地址。IDENTIFY DEVICE会通过PIO方式返回一个256字（512字节）的数据。其中第83个字的第10位表示是否支持48bit的地址。如下图（来自ATA官方手册AT Attachment with Packet Interface - 6）。  
[![](/uploads/2012/02/48bitaddress.jpg)](/uploads/2012/02/48bitaddress.jpg)  
补充2.由于不支持LBA48，我还是实现了LBA28。不过这个只能访问128G的硬盘了。至于CHS目前还是不考虑实现。  
补充3.PIO写的方式大概也是差不多的。准备慢慢实现，还有DMA读写硬盘也需要了解下。不过好消息是现在基本能看懂ATA的手册了。  
补充4.MiniKernel的代码依然写得很挫，暂时不准备共享出来，因为共享出来也没啥用，想学写系统的也看不懂那种烂代码。  
补充5.感觉读写硬盘是一个挺有意思地方，完全可以单独拿出来写一个系列的blog。只是有没有时间和懒不懒的问题。   
补充6.补充5的最后一句是P话，时间肯定是有的，就是懒而已。。。  

一个月一篇文章。。。多一点都没有。。。我果然是个需要被监督的人。。。  
