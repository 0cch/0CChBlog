---
author: admin
comments: true
date: 2013-08-31 17:24:36+00:00
layout: post
slug: '%e4%bd%bf%e7%94%a8pci-ide-controller%e8%af%bb%e5%86%99%e7%a1%ac%e7%9b%98-2'
title: 使用PCI IDE Controller读写硬盘 – 2
wordpress_id: 324
categories:
- MiniKernel
---

[![20130901011808](/uploads/2013/09/20130901011808.png)](/uploads/2013/09/20130901011808.png)

上一篇文章简单介绍了用PIO的方式读写硬盘数据，那么这篇文章就来介绍另一种数据传输的方式——DMA。

DMA全称是Direct memory access，以下依旧是wiki上的一段简短的介绍：  
“直接存储器访问（Direct Memory Access，DMA）是计算机科学中的一种内存访问技术。它允许某些电脑内部的硬件子系统（电脑外设），可以独立地直接读写系统存储器，而不需绕道中央处理器（CPU）。很多硬件的系统会使用DMA，包含硬盘控制器、绘图显卡、网卡和声卡。”

结合以上的描述和上一篇PIO的介绍，我们就可以发现DMA的优势，他最大的优势之一就是解放了CPU，让CPU不用重复的执行IO端口的操作读写数据。使用DMA的时候，CPU可以做其他的计算，读写数据的操作完全交由CPU外部的DMA芯片进行操作。当读写操作结束后CPU收到通知，然后再来处理读写之后的工作。DMA的另一个优势，就是速度快，不过这么说也不是完全正确的。因为古老的ISA DMA的速度只有4MB/s，现代CPU跑起PIO来，传输速度应该会比这个快。幸运的是，硬盘使用的DMA并不是ISA DMA，而是PCI DMA。PCI DMA的速度通常都超过了100MB/s，所以说速度也算是DMA的一个优势了吧。这里在顺便提一点，ISA DMA也不是完全没有用处的。软盘使用的DMA就是ISA DMA，虽然说软盘在现代的PC上已经消失了，但是如果要写自己的Mini Kernel，那么支持软盘以及ISA DMA还是很有必要的。

DMA的优势很明显，付出的代价就是编程起来相对复杂。那么下面就来介绍让IDE使用DMA传输数据的基础知识。

**物理区域描述符（Physical Region Descriptor）**  
[![20130828165621](/uploads/2013/09/20130828165621.jpg)](/uploads/2013/09/20130828165621.jpg)进行数据传输的物理内存块都用物理区域描述符进行描述。当所有在物理区域描述符表中的物理区域描述符所指向的内存都被传输完成后，数据传输就会停止。每个物理区域描述符是8字节。前4个字节指定的是物理内存区域的地址。接下来的两个字节指定内存数量。最后一个字节的第7位表示此理区域描述符是该表中最后一个描述符。

**物理区域描述符表（Physical Region Descriptor Table）**  
这张表中包含一定数量的物理区域描述符（PRD），描述符表必须是4字节对齐且不能跨越64K边界的内存。

**总线主控IDE寄存器（Bus Master IDE Register）**  
[![20130829115331](/uploads/2013/09/20130829115331.png)](/uploads/2013/09/20130829115331.png)

要获得总线主控IDE寄存器的基础地址，需要读取PCI配置空间IDE区域的0x20处的DWORD。由于这篇文章不会设计到如何读取PCI配置空间，所以这里的基址就采用bochs设定（0xC000）。后面代码部分也会直接硬编码。

**总线主控IDE命令寄存器（Bus Master IDE Command Register）**  
[![20130829120041](/uploads/2013/09/20130829120041.png)](/uploads/2013/09/20130829120041.png)

这里读写控制位是特别要注意的，刚开始容易理解错误。这里的读写是针对的设备，而不是CPU。也就是说这里的都，是指设备读取CPU指定的内存到自己的数据空间。而写是指将自己的数据空间的数据写到CPU指定的内存。所以这里的读写和我们对硬盘要做的读写是刚好相反的。

**总线主控IDE状态寄存器（Bus Master IDE Status Register）**  
[![20130829120248](/uploads/2013/09/20130829120248.png)](/uploads/2013/09/20130829120248.png)

**描述符指针寄存器（Descriptor Table Pointer Register）**  
用于设置物理区域描述符表的地址

对于初学者理论知识不用了解的过细，最好还是在代码中边写边学习，还是一边堆代码，一边解释吧。  
（关于下面代码的补充说明：由于使用DMA必须处理中断以获得DMA处理结束的信号，而配置中断又涉及到许多理论知识和额外代码（8259A &IDT），所以下面的代码就不涉及配置中断了，我这里就假设CPU已经进入保护模式，但没有开启分页并且IDE的中断已经配置完毕了。以下代码依旧为了保持最简洁，忽略了状态和结果的检查，在试验中够用即可）


{% highlight asm %}
mov dx, 0C000h ; 设置开始停止位为0，停止DMA
mov al, 0h
out dx, al

mov dx, 0C002h ; 清除中断位和错误位，这里清除方式比较特别，设置1后清除
mov al, 6h
out dx, al

; 配置描述符表，表地址为10000h，且只有一个描述符
; 描述符描述的物理基址是20000h，大小为512字节，且设置了第7位，
; 说明自己就是最后一个描述符
mov dword ptr [10000h], 20000h
mov dowrd ptr [10004h], 200h | 80000000h
mov dx, 0C004h
mov eax, 10000h
out dx, eax

mov dx, 3f6h   ; 这里不再设置nIEN，DMA需要中断
mov al, 0h
out dx, al

mov dx, 1f1h   ; 下面代码基本上和PIO一致，
mov al, 0      ; 详细注释请看上一篇文章
out dx, al

mov dx, 1f2h
mov al, 1
out dx, al

mov dx, 1f3h
mov al, 11h
out dx, al

mov dx, 1f4h
mov al, 22h
out dx, al

mov dx, 1f5h
mov al, 33h
out dx, al

mov dx, 1f6h
mov al, 44h
out dx, al

mov dx, 1f7h   ; 设置读取扇区的命令C8h，不同于20h，这个是DMA读取扇区的命令
mov al, C8h
out dx, al

mov dx, 0C000h ; 设置开始停止位为1，开始DMA，并且指定为读取硬盘操作
mov al, 9h     ; （对硬盘而言是写出，所以设置bit3）
out dx, al

call wait_int  ; 等待中断

mov dx, 0C000h ; 中断返回，设置开始停止位为0，停止DMA
mov al, 0h     ; 如果一切都顺利，那么20000h开始的512个字节
out dx, al     ; 就应该是读出的硬盘数据了
 {% endhighlight %}

上面的代码主要分为以下这几步：  
1) 在系统内存中配置PRD Table。每个PRD是8个字节，其中包含着一个起始内存地址和一个内存大小传送，而且PRD必须是4字节对齐的。  
2) 给PRD Table指针寄存器传入配置好的PRD Table的地址，设置读写控制位，清除中断和错误位。  
3) 设置读写命令，包括读写的驱动器，逻辑地址等（这里基本上和PIO类似）。  
4) 设置总线主控IDE命令寄存器的开始/停止位为1，控制器开始执行DMA操作。  
5) 控制器DMA操作结束，IDE设备发起中断，收到中断后，设置开始/停止位为0（我们省略了读取状态寄存器来查看操作是否成功的步骤。）  

如果只是从IDE方面来看，代码没有复杂多少，可惜的是他还需要配合其他计算机硬件，所以实际要用上的代码要比PIO多上了不少。最后还是给大家推荐一些深入理解DMA的资料吧。  
ISA DMA：[http://wiki.osdev.org/ISA_DMA](http://wiki.osdev.org/ISA_DMA)  
PCI DMA：[http://wiki.osdev.org/ATA/ATAPI_using_DMA](http://wiki.osdev.org/ATA/ATAPI_using_DMA)  
