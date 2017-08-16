---
author: admin
comments: true
date: 2012-08-15 17:09:50+00:00
layout: post
slug: dbglua%ef%bc%8c%e8%ae%a9lua%e8%84%9a%e6%9c%ac%e4%b9%9f%e8%83%bd%e6%8e%a7%e5%88%b6windbg%e8%bf%9b%e8%a1%8c%e8%b0%83%e8%af%95
title: dbgLua，让lua脚本也能控制windbg进行调试(更新1.0.1.1)
wordpress_id: 88
categories:
- Debugging
---

关于dbgLua：  
这是一个让windbg支持lua脚步的扩展程序。写这个程序的主要目的是希望能简单的取代windbg本身的脚本。因为我确实不喜欢windbg那种形式的脚本。

使用方法：将dbgLua.dll拷贝到windbg的winext下，编写lua脚本。调试的时候，在输入框中输入“!dbgLua.run d:\sample.lua”其中“d:\sample.lua”是你的脚步路径。

以下是1.0.0.1版本所支持的lua函数（后续可能会慢慢添加更多，看需求了）

{% codeblock lang:windbg %}
dbgLua 1.0.1.1 API

dprint 输出信息到windbg command窗口，例如dprint("hello")
exec 执行一条windbg命令，例如exec("bp kernel32!CreateFileW")
getreg 获得当前被调试对象的寄存器数据，例如eax_val = getreg("eax")
setreg 设置当前被调试对象的寄存器数据，例如setreg("eax", 123456)
readbyte 读取当前被调试对象的内存器数据，大小1字节
readword 同上，大小为2字节
readdword 同上，大小为4字节，例如mem_val = readxxxx(0x410000)
writebyte 写入当前被调试对象的内存器数据，大小1自己
writeword 同上，大小为2字节
writedword 同上，大小为4字节，例如writexxxx(0x410000, 654321)
readunicode 读取一个unicode字符串，例如str = readunicode(0x410000)
readascii 读取一个ascii字符串，例如str = readascii(0x410000)
wait 等待事件，例如exec("bp kernel32!CreateFileW;g");wait();
evalmasm masm表达式求值，例如val = evalmasm("11+2*3")
evalcpp cpp表达式求值，例如val = evalcpp("sizeof(char)")
getmoduleinfo 通过模块名获得模块基址和大学，例如base,size = getmoduleinfo("kernel32")
search 二进制查找，例如found = search(base, size, "cc 89 75 fc eb ")</blockquote>
{% endcodeblock %}

具体的结合这些函数进行调试的例子还没有准备好，等有机会了，我会准备好调试案例放到这里来。

另外这是一个初始版本，不保证没有bug，如果你在使用中发现了bug，或者有好的想法，例如添加什么函数功能，不妨联系我。

下载：

[dbgLua](/uploads/2012/08/dbgLua1.zip)(v1.0.1.1)

[dbgLua](/uploads/2012/08/dbgLua.zip)(v1.0.0.1)
