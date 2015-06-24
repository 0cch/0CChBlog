---
author: admin
comments: true
date: 2013-08-17 15:51:35+00:00
layout: post
slug: '%e4%bd%bf%e7%94%a8pci-ide-controller%e8%af%bb%e5%86%99%e7%a1%ac%e7%9b%98-0'
title: 使用PCI IDE Controller读写硬盘 - 0
wordpress_id: 305
categories:
- MiniKernel
---

# 前言


依稀记得我一年半以前曾经写过一篇关于PIO读硬盘数据的文章，当时就提到了读写硬盘操作很复杂，完全可以拿来做一个系列来写。当时也是真有写出一个系列的冲动，不过不巧的是，由于那段时间换工作，新的工作和底层的关系不太大，也就没时间继续读相关文档来把这个系列写下来。我现在还很清楚的记得当时有关使用IDE接口读写硬盘的中文资料特别的少，虽然英文资料倒是挺全面，但是对于英语不好的我来说，看起来还是挺吃力的。一年半后，我又好奇的搜索的这方面的中文资料，结果依旧令人失望。于是，我就决定我把知道的IDE方面的知识写出来，一方面算是自己的一个学习笔记，另一方面也算是一种分享。我将这个系列定位为学习笔记，就是说，文章的很多地方都是自己的理解，不能保证所提到的知识都是正确的。所以如果这篇文章有幸被你看见，并且发现了问题，请使用email联系我。


# IDE介绍


[![hdd-sata-pata-ide-aussie-pc-fix](/uploads/2013/08/hdd-sata-pata-ide-aussie-pc-fix.png)](/uploads/2013/08/hdd-sata-pata-ide-aussie-pc-fix.png)

IDE是Integrated Drive Electronics的简称，wiki上翻译的中文是“集成驱动电子设备”。我们可以认为它是一种接口，可以管理控制IDE的驱动器，比如硬盘，光驱等等。事实上，现在所谓的ATA/ATAPI接口的第一个版本的名称就叫做IDE，所以现在人们通常认为IDE就是PATA。如果现在去买主板，我们会发现集成PATA/IDE的主板已经消失了，现在主流主板都是使用的SATA，这是一套新的接口。那么，我们干嘛要学习一个已经淘汰的技术呢？其实不然，虽然硬件的接口被淘汰了，但是IDE的驱动器的控制模式还是存在的。现在的BIOS设置中，通常有一种叫做“legacy mode”或者“IDE”的选项，开启这个选项，系统就能如同操作IDE/PATA一样操作SATA了。而对于我这有写迷你内核的人来说，学习IDE是非常好的，因为虚拟机bochs模拟的硬盘设备就是IDE/PATA的，另一方面，把迷你内核拿到真机上做实验的时候，开启“legacy mode”或者“IDE”也能够很顺利的进行实验。

[![bios-sata-native-mode-ide-raid-ahci-ca184a](/uploads/2013/08/bios-sata-native-mode-ide-raid-ahci-ca184a.jpg)](/uploads/2013/08/bios-sata-native-mode-ide-raid-ahci-ca184a.jpg)


# IDE通道以及通道寄存器地址


IDE有2个通道，可以管理4个驱动器，分别是：  
通道1：  
第一主驱动器  
第一从驱动器  
通道2：  
第二主驱动器  
第二从驱动器  

每个通道都有两套用于控制其主从驱动器的寄存器，他们分别是 Control Block Registers 和 Command Block Registers。这些寄存器首先是有一个基础地址，然后通过按顺序可以获得整套寄存器地址，而寄存器的基础地址可以通过PCI Configuration Space来获得，更多情况下，我们不妨直接使用下面这张表来配置寄存器的基础地址。

[![2013-08-18_142953](/uploads/2013/08/2013-08-18_142953.png)](/uploads/2013/08/2013-08-18_142953.png)

事实上，这个基础地址是根据PCI IDE Controller模式不同而确定的。Compatibility模式下，寄存器的基础地址是固定的，但是在Native-PCI模式下，这个就需要读取具体的配置信息了。不过，大部分情况下，用上述地址不会有什么问题，所以这里就略过读取PCI Configuration Space的步骤了。

现在既然知道了寄存器的Base Address，那么下一步就是获得每个寄存器的地址了，其实这也非常简单。

Command Block Registers  
1F0 （170）（读取和写入）：数据寄存器  
1F1 （171）（读）：错误寄存器  
1F1 （171）（写入）：特性寄存器  
1F2 （172）（读取和写入）：扇区数寄存器  
1F3 （173）（读取和写入）：低LBA寄存器  
1F4 （174）（读取和写入）：中LBA寄存器  
1F5 （175）（读取和写入）：高LBA寄存器  
1F6 （176）（读取和写入）：驱动器/磁头寄存器  
1F7 （177）（读）：状态寄存器  
1F7 （177）（写入）：命令寄存器  

Control Block Registers  
3F6 （376）（读取）：备用状态寄存器  
3F6 （376）（写入）：设备控制寄存器  

另外还有一组寄存器叫做Bus Master IDE Register，我们使用DMA进行数据传输的时候会用到这类寄存器。现在就不去了解了，以免东西太多，造成不必要的混乱。

判断驱动器类型

前面说了很多的理论上的东西，现在我们看看怎么运用它们判断驱动器类型，比如是PATA还是SATA。当然，在做判断它们的类型之前，我们需要检测驱动器是否存在。判断方法很简单，先选择驱动器，对扇区数寄存器（1F2）和低LBA寄存器（1F3）写两个非0的数字，然后进行读取。如果读出的内容和写入的相同，那么我们可以认为驱动存在。就拿第一主驱动器举个例子：  
mov dx, 1f6h ; 驱动器寄存器  
xor al, al ; 选择驱动器，如果al第4位是0，那么选择0号设备，否则选择1号设备  
out dx, al  

mov dx, 1f2h  
mov al, 55h ; 随意写一个数  
out dx, al  

mov dx, 1f3h  
mov al, aah  
out dx, al  

mov dx, 1f2h  
in al, dx ; 读取后比较  
cmp al, 55h  
jnz not_exist  

mov dx, 1f3h  
in al, dx  
cmp al, aah  
jnz not_exist  

我用bochs测试的结果是，如果驱动器不存在，读出的数字总是0。接下来就可以获得驱动器的类型了，步骤是：1.选择驱动器（前面的操作以及做完这步了）2.软件复位驱动器。3.读取高LBA寄存器和中LBA寄存器。  

mov dx, 3f6h ; 选择设备控制寄存器  
mov al, 4h ; 设置第二位，表示软件复位  
out dx, al  

mov dx, 3f6h ; 选择设备控制寄存器  
mov al, 0h  
out dx, al  

mov dx, 1f4h  
in al, dx  
mov id1, al  

mov dx, 1f5h  
in al, dx  
mov id2, al  

当ID1和ID2为不同的数值的时候，表示的设备不同，如下表所示  
[![20130818152800](/uploads/2013/08/20130818152800.png)](/uploads/2013/08/20130818152800.png)  
我在bochs实验的得到的结果是PATA，虽然模拟的设备比较老，但是这正是我想要的。  

这样，我们读写硬盘的第一步，环境检测已经完成了。这个系列的下一篇文章，我们就来了解下通过PIO的方式读写硬盘。  


