---
author: admin
comments: true
date: 2013-09-21 08:39:56+00:00
layout: post
slug: floppy-disk-controller%e7%bc%96%e7%a8%8b
title: Floppy Disk Controller编程
wordpress_id: 348
categories:
- MiniKernel
---

[![N82077AA](/uploads/2013/09/N82077AA.jpg)](/uploads/2013/09/N82077AA.jpg)

看的没错，这篇文章将描述一些关于Floppy Disk Controller的编程知识。我们知道，在当今的计算机硬件体系中，软盘驱动器是一个已经完全被淘汰的设备，那么为什么还要有这样一篇文章？原因很简单，如果想构建自己的操作系统，必须有相应的存储介质，而软盘正是这样一个好的存储介质。他的容量虽然很小，但是却完全足够应付我们的内核程序，另一方面软盘驱动器的控制相对于之前我所介绍的硬盘的控制要简单的多，而且关于软盘驱动器控制的教程和文章在互联网上也非常的多（虽然绝大部分都是英文的）。基于以上几点，我认为还是有必要把自己学到的知识写下了分享。

Floppy Disk Controller，中文称为：软盘控制器，简称：FDC，是一个用来控制软盘驱动器的芯片。在1980年代到1990年代，软盘控制器普遍使用于个人电脑以及与IBM PC兼容的机型上，如 8272A、82078、82077SL以及82077AA，其中82077AA是最先进的一款芯片（1991年开始生产）。除了软盘控制器，软驱本身也在几十年的历史中留下了许多机型，如图所示：
[![floppy_types](/uploads/2013/09/floppy_types.png)](/uploads/2013/09/floppy_types.png)
实际上，我从刚刚接触软盘到最后软盘被淘汰，只使用过3.5英寸1.44MB的软盘，其他型号完全没有接触过。

对于CPU还运行在实模式下的启动引导程序和内核程序，我们可以调用BIOS提供的函数来完成软盘的访问，其中中断号是13h（INT13h），功能号为2（AH=2）是读取操作，功能号为3（AH=3）时是写入操作。实模式下通过中断读写软盘的资料很多（包括中文资料），如果想了解更多的实模式下访问软盘的知识，可以上网google一下，我这里就不做详细的介绍了。

虽然调用中断访问软盘简单，但是我们不能让自己的内核总是跑在实模式下啊。所以我们需要写一个能跑在保护模式下的软驱驱动，要完成这样的驱动，就必须对FDC进行编程了。不过在此之前，我们需要知道，到底PC上有没有软驱。要获得这个信息，我们需要读取CMOS，然后解析读取的信息即可。


{% codeblock lang:asm %}
mov dx, 70h
mov al, 10h
out dx, al

mov dx, 71h
in  al, dx

mov f_b, al
and f_b, 0fh
shr al, 4
mov f_a, al

f_a db	0h
f_b db	0h
 {% endcodeblock %}

要从CMOS中获得软盘信息，我们需要先给对应的端口设置正确的索引，然后再去数据端口读取数据。具体做法是设置0x70端口为0x10，然后读取0x71端口。读取到的信息都放在一个字节中，需要把字节分为两个部分，高四位是驱动器A的类型索引号，低四位是驱动器B的类型索引号。索引号与软盘类型的对应关系如下图所示：
[![cmos_floppytype](/uploads/2013/09/cmos_floppytype.png)](/uploads/2013/09/cmos_floppytype.png)

在确认了软驱存在的情况下，接下来就可以对FDC进行编程了。先来看看FDC的几个基本知识。

**寻址方式**
软盘驱动器使用CHS寻址方式。软盘介质总是有两个头（面），但磁道数和每个磁道的扇区扇区数是不一定的。通常情况下，1.44mb的软盘，他有80个磁道和每个磁道有18个扇区。另外值得注意的是，磁道和磁头是从0开始计算，但是扇区是从1开始计数的。即，有效的磁道通常为0到79，磁头为0或1，而扇区号是1到18的。如果访问0号扇区，那么一定会引起访问错误的。

**数据传输方式**
和硬盘的数据传输方式一样，软盘也支持PIO和DMA两种数据传输方式。
软盘使用的通常是ISA DMA方式（这和 PCI BusMastering DMA完全是两码事）。使用DMA传输的方法，简单来说就是这是DMA的通道2，如传输的字节数以及对应的物理地址。物理地址必须是以64k为边界的。当然，还需要设置IRQ6，当数据传输结束的时候，控制器将发送一个IRQ6的中断。用DMA传输数据，这个过程是不需要占用CPU时间的，对于多任务的系统是比较好的选择。缺点是ISA DMA这种古老的DMA比PIO还要慢。
PIO数据传输既可以使用轮询，也能使用中断。使用PIO模式传输数据的速度比DMA传输快10％，但这会消耗CPU周期，是一个巨大的成本问题。然而，如果我们的操作系统或应用程序是单任务的，那么没有别的程序需要CPU，这样你就也可以使用PIO模式。使用PIO的要点是，在设置好了各种命令后，需要等待中断或者轮询状态结果，最后还需要使用IO的方式，读取数据，也就是这部分需要消耗额外的CPU周期。
值得注意的是，bochs并不支持PIO模式，使用PIO模式的时候bochs会报错，提示没有完全实现PIO模式。所以我在实验代码中也没有写PIO的代码。毕竟我的实验环境是bochs。

**ISA DMA**
ISA DMA全称Industry Standard Architecture Direct Memory Access，是一种古老的DMA方式，速度比PIO还要慢，但是编程相对于PCI BusMastering DMA要简单一点。这里我并不打算详细介绍ISA DMA，因为说明它需要的篇幅不亚于这篇。后面的代码中，在必要的地方我会加入一些解释。

**3种模式**
这三种模式是：PC-AT模式，PS/2模式，Mode 30模式。现在最有可能看到硬件上仍然运行模式是30模式。

FDC寄存器
[![floppy_regs](/uploads/2013/09/floppy_regs.png)](/uploads/2013/09/floppy_regs.png)

如上图所示，上面的寄存器我们不会都用到，一般情况下大概只会用到一半的样子，其他的我们可以暂时不去理会。另外我在这里不会列出每个寄存器的详细参数，因为这些参数很多而且复杂，不仅单调乏味，而且容易让初学者望而却步。我采取的做法是，先列出控制FDC的代码，然后在需要讲解的地方详细的说明。

**实践**
下面就是一段控制FDC读取软盘数据的代码。需要说明的是这份代码为了保持简洁易学，它没有任何的错误检测，另外代码也假设了你已经初始化了PIC，并且设置好了IRQ6。


{% codeblock lang:asm %}
; MASM的宏应该不陌生吧，就不做解释了。
outb macro port:req, b:req
    mov dx, port
    mov al, b
    out dx, al
endm

inb macro port:req
    mov dx, port
    in al, dx
endm

wait_status macro
    inb 3f4h
@@:
    test al, 80h
    jz @B
endm

; ISA DMA 初始化部分， 由于ISA DMA不是这篇文章的重点
; 所以这里只说明大概的用途。
outb 0dh, 0ffh      ; 重置DMA控制器
outb 0ah, 6h        ; 选择设置2号DMA通道
outb 0ch, 0ffh      ; 重置Flipflop寄存器
outb 4h, 0h         ; 设置DMA的物理地址，需要设置两次
outb 4h, 0f0h       ; 我这里设置的是0xf000
outb 81h, 0h        ; 设置地址24bit的高8bit为0，也就是0x00f000
outb 0ch, 0ffh      ; 重置Flipflop寄存器
outb 5h, 0ffh       ; 设置物理内存大小，其大小为Length-1
outb 5h, 0fh        ; 我这里的内存大小是0x1000，所以设置为0xfff
outb 0ah, 2h        ; 选择清除2号DMA通道

; FDC的初始化过程
outb 3f2h, 0h       ; 1.重置数字输出寄存器
outb 3f2h, 0ch
call WaitIrq

mov ecx, 4
check_int:
wait_status
outb 3f5h, 8h       ; 发送8号命令，该命令清除控制器触发的中断
wait_status         ; 并且返回结果，这里重复4次，是为了清除4个软驱的状态
inb 3f5h
wait_status
inb 3f5h
wait_status
loop check_int

outb 3f7h, 0h       ; 2.设置传输速度为500kb/s
wait_status
outb 3f5h, 3h       ; 3.设置FDC里面三个时钟以及DMA。
wait_status
outb 3f5h, 0dfh
wait_status
outb 3f5h, 2h

outb 3f2h, 1ch      ; 开启软驱电动机
wait_status
outb 3f5h, 7h       ; 发送校验命令
wait_status
outb 3f5h, 0h       ; 选择0号软驱
wait_status
outb 3f5h, 8h       ; 发送清楚中断命令，获得结果
wait_status
inb 3f5h
wait_status
inb 3f5h
outb 3f2h, 4h       ; 关闭电动机

; 接下来是软盘的读取操作
outb 3f2h, 1ch      ; 开启电动机
wait_status
outb 3f5h, 0fh      ; 4.发送0f寻道命令
wait_status
outb 3f5h, 0h
wait_status
outb 3f5h, 0h
wait_status
outb 3f5h, 8h       ; 发送清楚中断命令，获得结果
wait_status
inb 3f5h
wait_status
inb 3f5h

; 设置ISA DMA为读取
outb 0ah, 6h
outb 0bh, 46h
outb 0ah, 2h

wait_status
outb 3f5h, 0e6h     ; 5.发送读取扇区命令
wait_status
outb 3f5h, 0h       ; 设置磁头和驱动器号
wait_status
outb 3f5h, 0h       ; 设置磁道
wait_status
outb 3f5h, 0h       ; 设置磁头
wait_status
outb 3f5h, 1h       ; 设置扇区号
wait_status
outb 3f5h, 2h       ; 设置扇区大小
wait_status
outb 3f5h, 8h       ; 设置读取扇区数量
wait_status
outb 3f5h, 1bh      ; 设置磁盘为3.5英寸
wait_status
outb 3f5h, 0ffh     ; 设置读取长度，总是0xff

call WaitIrq

mov ecx, 7
loop_ret:
wait_status
inb 3f5h
loop loop_ret

wait_status
outb 3f5h, 8h       ; 发送清楚中断命令，获得结果
wait_status
inb 3f5h
wait_status
inb 3f5h
outb 3f2h, 4h       ; 关闭电动机
 {% endcodeblock %}

1.重置数字输出寄存器  
这是一个只写寄存器，可以用来控制FDC，例如控制软驱电动机，重置控制器，选择目标软驱，设置数据模式，以下是他的详细参数  
Bits 0-1  
00 - 软驱 0  
01 - 软驱 1  
10 - 软驱 2  
11 - 软驱 3  
Bit 2 重置  
0 - 重置控制器  
1 - 开启控制器  
Bit 3 模式  
0 - IRQ 模式  
1 - DMA 模式  
Bits 4 - 7 电动机控制器 (软驱 0 - 3)  
0 - 停止电动机  
1 - 开启电动机  

我这里设置的是0Ch也就是说，选择了0号软驱，开启了控制器和DMA模式。

2.设置传输速度为500kb/s  
这个寄存器只有前两位有效，下面两位不同的组合表达了不同的速度，如下表：  
00 500 Kbps  
10 250 Kbps  
01 300 Kbps  
11 1 Mbps  

3.设置FDC里面三个时钟以及DMA  
三个时钟分别是步进速率时钟、磁头卸载时钟和磁头装入时钟。数据格式如下：  
S S S S H H H H - S=步进速率时钟 H=磁头卸载时钟  
H H H H H H H NDMA - H=磁头装入时钟 NDMA=0 (DMA模式) 或者 1 (非DMA模式)  
实际上这个大家可以随意设置，我设置的是步进速率时钟=3ms, 磁头卸载时钟=240ms, 磁头装入时钟=16ms  

4.发送寻道命令进行寻道  
寻道命令的参数是两个自己，分别代表磁头、柱面和驱动器号，格式如下  
x x x x x HD DR1 DR0 - HD=磁头 DR1/DR0 = 驱动器  
C C C C C C C C - C=柱面  

5.发送读取扇区命令  
读取和写入命令一样，有8个参数和7个返回值！  
第1个参数字节 = (磁头号 << 2) | 驱动器号 (驱动器号必须是当前选择的驱动器)  
第2个参数字节 = 柱面号  
第3个参数字节 = 磁头号 (没错，重复了 = =)  
第4个参数字节 = 开始的扇区号  
第5个参数字节 = 2 (总是2，代表软盘扇区大小总是512字节)  
第6个参数字节 = 操作扇区数  
第7个参数字节 = 0x1b (软盘大小是3.5in)  
第8个参数字节 = 0xff (总是0xff)  
这里不关心返回值，如果有兴趣可以自己查找资料。  

读取就是这样，如果要写入安排，只需要更改命令即可，这里就不再赘述了。最后按照国际惯例，提供一些深入学习的链接：  
[http://wiki.osdev.org/Floppy](http://wiki.osdev.org/Floppy)  
[http://en.wikipedia.org/wiki/Floppy](http://en.wikipedia.org/wiki/Floppy)  
[http://www.isdaman.com/alsos/hardware/fdc/floppy.htm](http://www.isdaman.com/alsos/hardware/fdc/floppy.htm)  
[http://www.osdever.net/documents/82077AA_FloppyControllerDatasheet.pdf](http://www.osdever.net/documents/82077AA_FloppyControllerDatasheet.pdf?the_id=41)  
