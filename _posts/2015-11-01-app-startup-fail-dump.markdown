---
author: admin
comments: true
date: 2015-11-01 21:17:15+00:00
layout: post
slug: 'app-startup-fail-dump'
title: 程序初始化失败DUMP分析
categories:
- debugging
---

拿到程序初始化失败的DUMP，一般情况下我们看到的栈是这个样子的：

{% highlight windbg %}

0:000> kb
ChildEBP RetAddr  Args to Child              
0012fc7c 7c92d9ca 7c972b53 c0000145 00000001 ntdll!KiFastSystemCallRet
0012fc80 7c972b53 c0000145 00000001 00000000 ntdll!NtRaiseHardError+0xc
0012fca4 7c960f9f c0000005 0012fd30 00370034 ntdll!LdrpInitializationFailure+0x2d
0012fd1c 7c92e457 0012fd30 7c920000 00000000 ntdll!_LdrpInitialize+0x1f9
00000000 00000000 00000000 00000000 00000000 ntdll!KiUserApcDispatcher+0x7

0:000> !error c0000145
Error code: (NTSTATUS) 0xc0000145 (3221225797) - {Application Error}  The application was unable to start correctly (0x%lx). Click OK to close the application.

0:000> !error c0000005
Error code: (NTSTATUS) 0xc0000005 (3221225477) - The instruction at 0x%p referenced memory at 0x%p. The memory could not be %s.

{% endhighlight %}

可以看到最后报错是c0000145，应用程序无法运行。而引起出错的是LdrpInitializationFailure，出错原因内存访问异常。但是具体是哪出错还不无法从此刻的栈看到，我们需要进一步分析。

{% highlight windbg %}

0:000> dds esp-1000 esp
...
0012f3c0  7c92e920 ntdll!_except_handler3
0012f3c4  00000001
0012f3c8  0012f470
0012f3cc  0012fd0c
0012f3d0  7c953fdc ntdll!RtlDispatchException+0xb1
0012f3d4  0012f470
0012f3d8  0012fd0c
0012f3dc  0012f48c
0012f3e0  0012f444
0012f3e4  7c92e920 ntdll!_except_handler3
0012f3e8  003d3810 someapp!PostMsg+0x27aa0
0012f3ec  0012f470
0012f3f0  b36caf32
0012f3f4  00153960
0012f3f8  7c93e584 ntdll!DbgPrint+0x1c
0012f3fc  00150178
0012f400  000000e8
0012f404  00000668
0012f408  00150000
0012f40c  0012f204
0012f410  7c940571 ntdll!RtlCreateActivationContext+0x2c
0012f414  c0000000
0012f418  00153960
0012f41c  003f0000
0012f420  00000000
0012f424  0012f444
0012f428  7c940610 ntdll!RtlCreateActivationContext+0xed
0012f42c  001539b4
0012f430  00000002
0012f434  00000008
0012f438  00000000
0012f43c  00000000
0012f440  00000000
0012f444  0012f750
0012f448  7c814880 kernel32!CreateActCtxW+0x75c
0012f44c  00130000
0012f450  0012d000
0012f454  00000000
0012f458  0012f76c
0012f45c  7c92e48a ntdll!KiUserExceptionDispatcher+0xe
0012f460  00000000
0012f464  0012f48c
0012f468  0012f470
0012f46c  0012f48c
0012f470  c0000005
0012f474  00000000
0012f478  00000000
0012f47c  7c93ccf2 ntdll!LdrpHandleOneOldFormatImportDescriptor+0x21
0012f480  00000002
0012f484  00000000
0012f488  d16cca32
0012f48c  0001003f
...

{% endhighlight %}

这里我们就可以看到异常发生的栈了。

{% highlight windbg %}

0:000> .exr 0012f470
ExceptionAddress: 7c93ccf2 (ntdll!LdrpHandleOneOldFormatImportDescriptor+0x00000021)
   ExceptionCode: c0000005 (Access violation)
  ExceptionFlags: 00000000
NumberParameters: 2
   Parameter[0]: 00000000
   Parameter[1]: d16cca32
Attempt to read from address d16cca32

0:000> .cxr 0012f48c
eax=003a0000 ebx=00253010 ecx=d132ca32 edx=00033810 esi=b36caf32 edi=003d3810
eip=7c93ccf2 esp=0012f758 ebp=0012f76c iopl=0         nv up ei ng nz na po nc
cs=001b  ss=0023  ds=0023  es=0023  fs=003b  gs=0000             efl=00010282
ntdll!LdrpHandleOneOldFormatImportDescriptor+0x21:
7c93ccf2 833c0800        cmp     dword ptr [eax+ecx],0 ds:0023:d16cca32=????????
0:000> kb
  *** Stack trace for last set context - .thread/.cxr resets it
ChildEBP RetAddr  Args to Child              
0012f76c 7c93ccc4 7ffd9000 00020498 00253010 ntdll!LdrpHandleOneOldFormatImportDescriptor+0x21
0012f784 7c93bc1e 7ffd9000 00020498 00253010 ntdll!LdrpHandleOldFormatImportDescriptors+0x1f
0012f800 7c93d216 00020498 00253010 00434398 ntdll!LdrpWalkImportDescriptor+0x19e
0012fa50 7c93cd1d 00020498 004396ca 00400000 ntdll!LdrpLoadImportModule+0x1c8
0012fa80 7c93ccc4 7ffd9000 00020498 00251ec0 ntdll!LdrpHandleOneOldFormatImportDescriptor+0x5e
0012fa98 7c93bc1e 7ffd9000 00020498 00251ec0 ntdll!LdrpHandleOldFormatImportDescriptors+0x1f
0012fb14 7c9418b5 00020498 00251ec0 7ffdf000 ntdll!LdrpWalkImportDescriptor+0x19e
0012fc94 00000000 0012fca0 00000000 0012fd1c ntdll!LdrpInitializeProcess+0xe02

0:000> dt ntdll!_LDR_DATA_TABLE_ENTRY 00253010 
   +0x000 InLoadOrderLinks : _LIST_ENTRY [ 0x251e9c - 0x252ee0 ]
   +0x008 InMemoryOrderLinks : _LIST_ENTRY [ 0x251ea4 - 0x252ee8 ]
   +0x010 InInitializationOrderLinks : _LIST_ENTRY [ 0x0 - 0x0 ]
   +0x018 DllBase          : 0x003a0000 Void
   +0x01c EntryPoint       : 0x003c1ae4 Void
   +0x020 SizeOfImage      : 0x43000
   +0x024 FullDllName      : _UNICODE_STRING "C:\Program Files\S-dir\Some-dir\someapp.dll"
   +0x02c BaseDllName      : _UNICODE_STRING "someapp.dll"
   +0x034 Flags            : 0x200006
   +0x038 LoadCount        : 0
   +0x03a TlsIndex         : 0
   +0x03c HashLinks        : _LIST_ENTRY [ 0x7c99e2f0 - 0x252a5c ]
   +0x03c SectionPointer   : 0x7c99e2f0 Void
   +0x040 CheckSum         : 0x252a5c
   +0x044 TimeDateStamp    : 0x5618c3dc
   +0x044 LoadedImports    : 0x5618c3dc Void
   +0x048 EntryPointActivationContext : 0x00153960 Void
   +0x04c PatchInformation : (null) 
   
{% endhighlight %}

可以看到正在加载someapp.dll，并且处理导入表的时候出了错。来看看这个模块的导入表

{% highlight windbg %}

0:000> !dh someapp -f

File Type: DLL
FILE HEADER VALUES
     14C machine (i386)
       6 number of sections
5618C3DC time date stamp Sat Oct 10 15:53:00 2015

       0 file pointer to symbol table
       0 number of symbols
      E0 size of optional header
    2102 characteristics
            Executable
            32 bit word machine
            DLL

OPTIONAL HEADER VALUES
     10B magic #
   10.00 linker version
   27A00 size of code
   15C00 size of initialized data
       0 size of uninitialized data
   21AE4 address of entry point
    1000 base of code
         ----- new -----
10000000 image base
    1000 section alignment
     200 file alignment
       2 subsystem (Windows GUI)
    5.01 operating system version
    0.00 image version
    5.01 subsystem version
   43000 size of image
     400 size of headers
   4943E checksum
00100000 size of stack reserve
00001000 size of stack commit
00100000 size of heap reserve
00001000 size of heap commit
     140  DLL characteristics
            Dynamic base
            NX compatible
   34BE0 [     1E0] address [size] of Export Directory
   33810 [      B4] address [size] of Import Directory
   3A000 [     4CC] address [size] of Resource Directory
       0 [       0] address [size] of Exception Directory
       0 [       0] address [size] of Security Directory
   3B000 [    3954] address [size] of Base Relocation Directory
   29340 [      1C] address [size] of Debug Directory
       0 [       0] address [size] of Description Directory
       0 [       0] address [size] of Special Directory
   2DD80 [      18] address [size] of Thread Storage Directory
   2DD38 [      40] address [size] of Load Configuration Directory
       0 [       0] address [size] of Bound Import Directory
   29000 [     2CC] address [size] of Import Address Table Directory
       0 [       0] address [size] of Delay Import Directory
       0 [       0] address [size] of COR20 Header Directory
       0 [       0] address [size] of Reserved Directory

0:000> dc someapp+33810 someapp+33810+B4
003d3810  60325c32 68326432 90326c32 b332af32  2\2`2d2h2l2.2.2.
003d3820  d132ca32 df32db32 0032fc32 30332033  2.2.2.2.2.2.3 30
003d3830  40333833 4c334833 54335033 5c335833  383@3H3L3P3T3X3\
003d3840  64336033 6c336833 74337033 7c337833  3`3d3h3l3p3t3x3|
003d3850  84338033 8c338833 94339033 ce33b433  3.3.3.3.3.3.3.3.
003d3860  e933d233 f733f333 b134a633 0434e134  3.3.3.3.3.4.4.4.
003d3870  44353935 94357135 d435c935 57361a35  595D5q5.5.5.5.6W
003d3880  be366736 0c36d036 4b374037 b3377b37  6g6.6.6.7@7K7{7.
003d3890  ea37cf37 45380e37 81385e38 a0388a38  7.7.7.8E8^8.8.8.
003d38a0  fb38d338 4b392438 a4399939 0039dd39  8.8.8$9K9.9.9.9.
003d38b0  403a353a c33a863a 2a3ad33a 6b3b3c3b  :5:@:.:.:.:*;<;k
003d38c0  cf3b933b 1d3bea3b                    ;.;.;.;.

{% endhighlight %}

所以这样就清楚了，someapp.dll的输入表被破坏了，导致加载他的程序无法运行起来。