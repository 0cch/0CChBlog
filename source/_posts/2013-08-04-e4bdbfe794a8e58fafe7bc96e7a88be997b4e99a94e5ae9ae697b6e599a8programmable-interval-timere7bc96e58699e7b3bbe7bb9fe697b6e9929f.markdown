---
author: admin
comments: true
date: 2013-08-04 08:12:15+00:00
layout: post
slug: '%e4%bd%bf%e7%94%a8%e5%8f%af%e7%bc%96%e7%a8%8b%e9%97%b4%e9%9a%94%e5%ae%9a%e6%97%b6%e5%99%a8programmable-interval-timer%e7%bc%96%e5%86%99%e7%b3%bb%e7%bb%9f%e6%97%b6%e9%92%9f'
title: 使用可编程间隔定时器(Programmable Interval Timer)编写系统时钟
wordpress_id: 290
categories:
- MiniKernel
---

很久没有写关于MiniKernel的文章了，这周末看着有点时间，就写一点关于定时器的东西吧。

[![8253](/uploads/2013/08/8253.jpg)](/uploads/2013/08/8253.jpg)


## 简单介绍


可编程间隔定时器（PIT）芯片（也就是我们常说的8253/8254芯片），他包含了1个振荡器，1个预分频器和3个独立的分频器。每个分频器有一个输出，它是可以让定时器控制外部电路（例如，IRQ0）

其中PIT的振荡器的频率是1.193182 MHz。具体为什么是这么个奇怪的数字，是有一点历史的，但这些不是这篇文章的重点，有兴趣的可以Google一下。

分频器也比较容易理解，就是把高频分割为低频，一般来说就是使用一个计数器，当每次脉冲的时候，计数器的数值减少，当计数器数值为0的时候，在输出上产生一个脉冲，并且计数器复位，重新开始计数。

PIT定时器的准确度依赖于所使用的振荡器，一般来说，一天的浮动为+/- 1.73秒。不过这种浮动，对我们影响并不大，所以也不必过于在意。

PIT的输出通道一共有三个：通道0，直接连接到IRQ0，并且触发时钟中断（这个通道是我们写MiniKernel最重要的一个。）。通道1，貌似以前是定时刷新内存的，但是现在没什么用了。通道2是连接到PC扬声器的，目前我也没有研究过它的作用。

这里再重点介绍一下通道0：PIT通道0的输出是连接到PIC芯片上的（8259A，以后有空也可以写一篇简单的介绍），因此，它能生成一个IRQ0的中断。通常情况下，在开机时，BIOS会将通道0的计数器的值设置为65535或0（其中如果是0，硬件会自动转化为65536），这样，它的输出频率就是18.2065Hz。另外，之所以说通道0最重要，主要原因就是它是三个通道中，唯一一个能连接到IRQ的，对于编写系统时钟至关重要。



## 编程相关

PIT是使用以下IO端口进行控制：
{% codeblock lang:windbg %}
I/O 端口     用途
0x40         通道0的数据端口
0x41         通道1的数据端口
0x42         通道2的数据端口
0x43         控制字寄存器
{% endcodeblock %}

控制字寄存器的具体内容如下：

[![8253cw](/uploads/2013/08/8253cw.png)](/uploads/2013/08/8253cw.png)

{% codeblock lang:windbg %}
Bits
6 7选择通道：
0 0 =通道0
0 1 =通道1
1 0 =通道2
1 1 =回读命令（只有8254支持）
4 5访问模式：
0 0 =锁存计数值命令
0 1 =访问模式：读写最低有效字节
1 0 =访问模式：读写最高有效字节
1 1 =访问模式：先读写最低有效字节，然后读写高位字节
1-3工作模式：
0 0 0 =模式0（计数结束中断）
0 0 1 =模式1（硬件再触发单稳）
0 1 0 =模式2（速率发生器）
0 1 1 =模式3（方波发生器）
1 0 0 =模式4（软件触发闸门）
1 0 1 =模式5（硬件触发闸门）
1 1 0 =模式2（速率发生器，与010B相同）
1 1 1 =模式3（方波发生器，与011B相同）
0 BCD /二进制模式：0 = 16位二进制数，1 =四位BCD</blockquote>
{% endcodeblock %}


这里，我们要写系统时钟，那么就应该这样选择：

  1. 选择通道，必须是通道0，那么bit 6 7 就分别为 0 0。  
  2. 由于我们的计数器是16位的，那么访问模式bit 4 5就应该选择1 1。  
  3. 数据模式，毫无疑问选择二进制模式。  
  4. 最后就是工作模式了，应该选择什么呢？这里我也不想把这些模式都讲的很清楚，因为那样就涉及到引脚和电平等等硬件知识。现在我们只需要知道0，1，4，5这些模式都可以触发中断，但是却不会自动复位。只有模式2和3会自动复位。所以模式2 3都是我们可以用来作为系统时钟的模式。那么1-3 bits可以为0 1 0或者0 1 1。

## 例子：  

现在假设，系统的时钟中断例程已经设置好了，并且设置好了PIC的IRQ0到这个例程。下面要做的事情就是，设置时钟中断的频率了。

{% codeblock lang:asm %}
mov dx, 1193180 / 100 ; 没10ms触发一次中断
mov al, 110110b ; 设置控制字寄存器，上面已经介绍过每个位的含意
out 0x43, al
mov ax, dx
out 0x40, al   ;先设置低位的值
xchg ah, al
out 0x40, al   ;再设置高位的值
{% endcodeblock %}


总的来说8253 和 8254 是很有用的芯片。他们可以用在很多不同的设备，并用于很多不同的目的。不过就目前的PC来说，系统对他们的依赖已经不像以前那样严重了。随着科技的进步，APIC Timer已经可以取代他们。另外2005年，Intel和MS已经联合开发了新的高精度的定时器芯片High Precision Event Timer（HPET）。

虽然成熟的系统可能已经不用8253 和 8254了，但是对于我们自己的迷你内核来说，使用它们就完全足够了
