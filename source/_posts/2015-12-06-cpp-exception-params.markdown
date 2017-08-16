---
author: admin
comments: true
date: 2015-12-06 21:57:50+00:00
layout: post
slug: 'cpp-exception-params'
title: C++异常的参数分析(0xE06D7363)
categories:
- debugging
---

Visual C++ 的编译器用0xE06D7363表示C++异常。 0xE06D7363表示的意思就是.msc。  

{% codeblock lang:windbg %}

0:025> .formats 0xE06D7363
Evaluate expression:
  Hex:     e06d7363
  Decimal: -529697949
  Octal:   34033271543
  Binary:  11100000 01101101 01110011 01100011
  Chars:   .msc
  Time:    ***** Invalid
  Float:   low -6.84405e+019 high 0
  Double:  1.86029e-314
  
{% endcodeblock %}

抛出异常代码的同时，还会带有三个到四个参数：  
参数0是一个magic code，一般为0x19930520，我们不用管他  
参数1是时异常抛出的对象指针  
参数2是抛出异常的基本信息  
参数3是抛出异常的模块基址(只有64位的程序才会有这个参数)，该基址加上异常信息的偏移才能获得信息的真正内存地址。  

{% codeblock lang:windbg %}

0:025> .exr -1
ExceptionAddress: 75c8c41f (KERNELBASE!RaiseException+0x00000058)
   ExceptionCode: e06d7363 (C++ EH exception)
  ExceptionFlags: 00000001
NumberParameters: 3
   Parameter[0]: 19930520
   Parameter[1]: 09c9f324
   Parameter[2]: 6b5d0298
   
{% endcodeblock %}

6b5d0298就是我们想要取得的信息，信息存储的格式为_s__ThrowInfo。  

{% codeblock lang:windbg %}

0:025> dt 6b5d0298 ole32!_s__ThrowInfo
   +0x000 attributes       : 0
   +0x004 pmfnUnwind       : 0x6b523b50     void  +0
   +0x008 pForwardCompat   : (null) 
   +0x00c pCatchableTypeArray : 0x6b5d028c _s__CatchableTypeArray
   
{% endcodeblock %}

然后可以取得pCatchableTypeArray，我们可以从中获取抛出异常的类型信息。  

{% codeblock lang:windbg %}

0:025> dt 0x6b5d028c ole32!_s__CatchableTypeArray -r1
   +0x000 nCatchableTypes  : 0n2
   +0x004 arrayOfCatchableTypes : [0] 0x6b5d0270 _s__CatchableType
      +0x000 properties       : 0
      +0x004 pType            : 0x6b5e58f0 _TypeDescriptor
      +0x008 thisDisplacement : _PMD
      +0x014 sizeOrOffset     : 0n48
      +0x018 copyFunction     : 0x6b523cc0        void  +0
	  
{% endcodeblock %}

到这里我们就取得了类型的描述结构体了，最后就能从中获取抛出的异常类型

{% codeblock lang:windbg %}

0:025> dt 0x6b5e58f0 ole32!_TypeDescriptor
   +0x000 pVFTable         : 0x6b5c36e8 Void
   +0x004 spare            : (null) 
   +0x008 name             : [0]  ".?AVinterprocess_exception@interprocess@boost@@"

{% endcodeblock %}

