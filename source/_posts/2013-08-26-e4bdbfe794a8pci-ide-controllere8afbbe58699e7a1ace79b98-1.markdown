---
author: admin
comments: true
date: 2013-08-26 15:00:42+00:00
layout: post
slug: '%e4%bd%bf%e7%94%a8pci-ide-controller%e8%af%bb%e5%86%99%e7%a1%ac%e7%9b%98-1'
title: 使用PCI IDE Controller读写硬盘 – 1
wordpress_id: 316
categories:
- MiniKernel
---

[![PIO_hd04](/uploads/2013/08/PIO_hd04.jpg)](/uploads/2013/08/PIO_hd04.jpg)

上一篇文章中提到了一些IDE基础的知识，并且知道了如何判断IDE的类型。接下来介绍IDE最基本的IO方法——PIO。

PIO是Programmed input/output的缩写，下面是一段wiki上对PIO的介绍：  
“可编程输入输出（英语：PIO）是CPU与外围设备（如网卡、硬盘等）传输数据的一种方法。当 CPU 上执行的软件程序使用 I/O 地址空间来与输入/输出设备（I/O 设备）进行数据传输时，系统即进行了 PIO. 这和直接内存存取（DMA）恰好相反。

在 PC 上最常见的使用 PIO 的例子是 ATA 接口，但 ATA 接口也可以在 DMA 模式下工作。 PC 上的许多比较古老的设备也使用 PIO, 如串行端口、并行端口（在不使用 ECP 模式时）、PS/2 接口、MIDI 接口、内部时钟以及一些古老的网卡。”

实际上，在DMA出现之前，PIO是硬盘唯一的数据传输的方式。就算是现在，ATA的部分命令还必须使用PIO的方式获得数据，例如DEVICE IDENTIFY。PIO传输数据的思想简单直接，例如从硬盘都数据，只需要在硬盘准备好了之后，不断的读取特定端口就能将数据读出来了。例如 in eax, dx（dx里是数据端口号），这样每次就传输4个字节，也就是说如果需要传输512（一个扇区）的数据，需要128次IO。这样一方面数据传输的效率难以提高，另一方面还占用了CPU时间。所以被DMA淘汰也是有道理的。然而，他也有自身的优势，那就是编程起来简单方便。不像DMA那样，需要配置中断和其他一些事情。简单的对IDE下命令就可以达到数据传输的目的了。所以这也是我们入门的很好的切入口。

最后，在开始堆代码之前，我们必须了解硬盘的两种寻址模式：CHS(cylinders-heads-sectors，磁柱-磁头-扇区)寻址模式和LBA(Logical Block Address, 逻辑区块地址)寻址模式。  
CHS寻址模式，区块必须以硬盘上某个磁柱、磁头、扇区的硬件位置所合成的地址来指定。  
LBA寻址模式从0开始编号来定位区块，第一区块LBA=0，第二区块LBA=1，依此类推。  

前者的描述更偏向物理，理解起来需要转换，而后者更偏向思维逻辑，理解起来直接了当。既然LBA模式简单容易理解，所以下面的文章和代码所采用的寻址模式就默认是LBA28。所谓LBA28其实是LBA模式中的子模式，它可以寻址到128GB，与之对应的是LBA48，它的寻址范围可以达到128PB，这个对我们来说没啥意义，所以还是选用LBA28。另外CHS模式还需要解释硬盘机械方面的知识，前提太多不利于学习，就暂时搁下吧。

好了，介绍理论的知识不是这篇文章的目的，就让我们一边堆代码，一边讲解这些理论知识吧。下面就是一段读取硬盘数据的asm代码。


{% codeblock lang:asm %}
    mov dx, 3f6h    ; 1.设置nIEN
    mov al, 2h
    out dx, al
    
    mov dx, 1f1h    ; 2.设置FEATURES为0
    mov al, 0
    out dx, al
        
    mov dx, 1f2h    ; 3.设置读取的扇区数量，这里指定为1
    mov al, 1
    out dx, al
        
    mov dx, 1f3h    ; 4.设置读取地址的低八位
    mov al, 11h
    out dx, al
        
    mov dx, 1f4h    ; 5.设置读取地址的中八位
    mov al, 22h
    out dx, al
        
    mov dx, 1f5h    ; 6.设置读取地址的高八位
    mov al, 33h
    out dx, al
    
    mov dx, 1f6h    ; 7.设置LBA模式，目标驱动器，和地址的最高4位
    mov al, 44h     ;   其中第6位（40h）是设置LBA模式，第4位设置主从驱动器，0为主驱动器
    out dx, al      ;   后四位就是LBA最高位了，这里是4h，也就是说读取的地址是04332211h
        
    mov dx, 1f7h    ; 8.设置读取扇区的命令20h
    mov al, 20h
    out dx, al
pri_stat:
    in al, dx       ; 9.轮询状态寄存器，第3位（8）如果是设置状态，表明可以进行数据传输了。
    test al, 8
    jz pri_stat
         
    mov ecx, 512/4  ; IO 128次！
    mov edi, offset buffer  ; 设置buffer地址到edi
    mov dx, 1f0h
    rep insw        ; 10.循环128次从数据寄存器读取1个扇区的数据
 {% endcodeblock %}

上面的代码主要分为以下这几步：  
1.我们现在不需要IRQs，所以我们这里要禁用它，以免发生不必要的问题。这里，我们设置CBR（Control Block Register）的第1位，也叫nIEN位，只要它处于设置的状态，那么IRQs就不会触发。  
2.设置FEATURES寄存器  
3.设置扇区数寄存器  
4.设置LBA低8位  
5.设置LBA中8位  
6.设置LBA中高8位  
7.设置LBA最高4位，以及驱动器，指明使用LBA模式  
8.设置读扇区命令  
9.轮询等待完成状态  
10.循环128次读取1个扇区的数据（128*4=512 bytes）  

再看看写扇区有哪些不同呢？没错，只有最后几条指令有细微的差别。


{% codeblock lang:asm %}
    mov dx, 1f7h
    mov al, 30h     ; 这里命令改为30h，写扇区
    out dx, al
pri_stat:
    in al,dx
    test al,8
    jz pri_stat
    
    mov ecx, 512/4
    mov esi, offset buffer ; 设置buffer地址到esi
    mov dx, 1f0h
    rep outsd       ; 这里指令改为outsd
 {% endcodeblock %}

看起来还是很简单的吧！不过这也是当然的，因为我们没有做任何的排错和检验处理。不过这样的代码才是初学者最喜欢看到的吧，同样对于做操作系统实验也没多大问题。

最后，如果对CHS以及LBA和CHS的转换关系感兴趣，推荐翻阅wiki：  
[http://en.wikipedia.org/wiki/Cylinder-head-sector](http://en.wikipedia.org/wiki/Cylinder-head-sector)  
[http://en.wikipedia.org/wiki/Logical_block_addressing#CHS_conversion](http://en.wikipedia.org/wiki/Logical_block_addressing#CHS_conversion)  

在下一篇的文章中，会介绍一些用PCI DMA的方式读写硬盘的知识。
