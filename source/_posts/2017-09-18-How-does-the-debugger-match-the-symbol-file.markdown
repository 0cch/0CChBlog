---
author: admin
comments: true
layout: post
slug: 'How-does-the-debugger-match-the-symbol-file'
title: 调试器是怎么匹配程序的符号文件的
date: 2017-09-18 14:31:32
categories:
- Debugging
---

微软的天才软件工程师们设计的PE（Portable Executable）文件数据结构有极强的扩展性和兼容性。我们关心的符号文件信息存储在PE结构中，一个叫做Debug Directory的节里。

{% codeblock lang:windbg %}

0:000> !dh -f ntdll

File Type: DLL
FILE HEADER VALUES
    8664 machine (X64)
       7 number of sections
590296CE time date stamp Thu Apr 27 18:11:42 2017

       0 file pointer to symbol table
       0 number of symbols
      F0 size of optional header
    2022 characteristics
            Executable
            App can handle >2gb addresses
            DLL

OPTIONAL HEADER VALUES
     20B magic #
    9.00 linker version
   FB800 size of code
   A9600 size of initialized data
       0 size of uninitialized data
       0 address of entry point
    1000 base of code
         ----- new -----
00000000774e0000 image base
    1000 section alignment
     200 file alignment
       3 subsystem (Windows CUI)
    6.01 operating system version
    6.01 image version
    6.01 subsystem version
  1AA000 size of image
     400 size of headers
  1B5DB0 checksum
0000000000040000 size of stack reserve
0000000000001000 size of stack commit
0000000000100000 size of heap reserve
0000000000001000 size of heap commit
     140  DLL characteristics
            Dynamic base
            NX compatible
  101200 [    F1A3] address [size] of Export Directory
       0 [       0] address [size] of Import Directory
  14E000 [   5A028] address [size] of Resource Directory
  13B000 [   127EC] address [size] of Exception Directory
  1A2E00 [    4300] address [size] of Security Directory
  1A9000 [     4E8] address [size] of Base Relocation Directory
   FC58C [      38] address [size] of Debug Directory
       0 [       0] address [size] of Description Directory
       0 [       0] address [size] of Special Directory
       0 [       0] address [size] of Thread Storage Directory
       0 [       0] address [size] of Load Configuration Directory
       0 [       0] address [size] of Bound Import Directory
       0 [       0] address [size] of Import Address Table Directory
       0 [       0] address [size] of Delay Import Directory
       0 [       0] address [size] of COR20 Header Directory
       0 [       0] address [size] of Reserved Directory
	   
{% endcodeblock %}

使用!dh命令可以显示PE文件的关键信息，这里可以看到Debug Directory的偏移地址是FC58C，大小是38个字节，其对应结构体是_IMAGE_DEBUG_DIRECTORY。

{% codeblock lang:cpp %}

typedef struct _IMAGE_DEBUG_DIRECTORY {
    DWORD   Characteristics;
    DWORD   TimeDateStamp;
    WORD    MajorVersion;
    WORD    MinorVersion;
    DWORD   Type;
    DWORD   SizeOfData;
    DWORD   AddressOfRawData;
    DWORD   PointerToRawData;
} IMAGE_DEBUG_DIRECTORY, *PIMAGE_DEBUG_DIRECTORY;

#define IMAGE_DEBUG_TYPE_UNKNOWN          0
#define IMAGE_DEBUG_TYPE_COFF             1
#define IMAGE_DEBUG_TYPE_CODEVIEW         2
#define IMAGE_DEBUG_TYPE_FPO              3
#define IMAGE_DEBUG_TYPE_MISC             4
#define IMAGE_DEBUG_TYPE_EXCEPTION        5
#define IMAGE_DEBUG_TYPE_FIXUP            6
#define IMAGE_DEBUG_TYPE_OMAP_TO_SRC      7
#define IMAGE_DEBUG_TYPE_OMAP_FROM_SRC    8
#define IMAGE_DEBUG_TYPE_BORLAND          9
#define IMAGE_DEBUG_TYPE_RESERVED10       10
#define IMAGE_DEBUG_TYPE_CLSID            11

{% endcodeblock %}

{% codeblock lang:windbg %}

0:000> dt ntdll+FC58C ole32!_IMAGE_DEBUG_DIRECTORY
   +0x000 Characteristics  : 0
   +0x004 TimeDateStamp    : 0x590288a9
   +0x008 MajorVersion     : 0
   +0x00a MinorVersion     : 0
   +0x00c Type             : 2
   +0x010 SizeOfData       : 0x22
   +0x014 AddressOfRawData : 0xfc5c8
   +0x018 PointerToRawData : 0xfb9c8
   
{% endcodeblock %}

需要注意的是这三个数据成员，Type，SizeOfData以及AddressOfRawData。其中Type是Debug数据类型，SizeOfData是数据大小，AddressOfRawData是数据对应的内存地址。通过dt命令，可以查看结构体和数据的对应关系。从上面的输出可知Debug数据类型是CODEVIEW，数据大小是0x22个字节，数据的内存偏移是0xfc5c8。

{% codeblock lang:windbg %}

0:000> db ntdll+0xfc5c8
00000000`775dc5c8  52 53 44 53 49 7b 4d 74-81 7b 0c 47 a2 d8 a8 d2  RSDSI{Mt.{.G....
00000000`775dc5d8  62 fc 8a 29 02 00 00 00-6e 74 64 6c 6c 2e 70 64  b..)....ntdll.pd
00000000`775dc5e8  62 00 00 00 00 00 00 00-00 00 00 00 00 00 00 00  b...............
00000000`775dc5f8  00 00 00 00 00 00 00 00-00 00 00 00 00 00 00 00  ................
00000000`775dc608  00 00 00 00 00 00 00 00-00 00 00 00 00 00 00 00  ................
00000000`775dc618  00 00 00 00 00 00 00 00-00 00 00 00 00 00 00 00  ................
00000000`775dc628  00 00 00 00 00 00 00 00-00 00 00 00 00 00 00 00  ................
00000000`775dc638  00 00 00 00 00 00 00 00-00 00 00 00 00 00 00 00  ................

{% endcodeblock %}

使用db命令查看这部分数据，我们可以发现ntdll.pdb的字符串。实际上，通过type已经知道了Debug数据类型是CODEVIEW，这样就可以确定数据的结构体是：

{% codeblock lang:cpp %}

struct CV_INFO_PDB
{
  DWORD  CvSignature;
  GUID Signature;
  DWORD Age;
  BYTE PdbFileName[];
} ;

{% endcodeblock %}

{% codeblock lang:windbg %}

0:000> dt _guid ntdll+0xfc5c8+4
ntdll!_GUID
 {744d7b49-7b81-470c-a2d8-a8d262fc8a29}
   +0x000 Data1            : 0x744d7b49
   +0x004 Data2            : 0x7b81
   +0x006 Data3            : 0x470c
   +0x008 Data4            : [8]  "???"
可以看到CvSignature = “RSDS”， Signature = {744d7b49-7b81-470c-a2d8-a8d262fc8a29}，Age = 2，PdbFileName=“ntdll.pdb”。

0:000> !lmi ntdll
Loaded Module Info: [ntdll] 
         Module: ntdll
   Base Address: 00000000774e0000
     Image Name: ntdll.dll
   Machine Type: 34404 (X64)
     Time Stamp: 590296ce Thu Apr 27 18:11:42 2017
           Size: 1aa000
       CheckSum: 1b5db0
Characteristics: 2022  perf
Debug Data Dirs: Type  Size     VA  Pointer
             CODEVIEW    22, fc5c8,   fb9c8 RSDS - GUID: {744D7B49-7B81-470C-A2D8-A8D262FC8A29}
               Age: 2, Pdb: ntdll.pdb
                CLSID     4, fc5c4,   fb9c4 [Data not mapped]
     Image Type: FILE     - Image read successfully from debugger.
                 C:\Windows\SYSTEM32\ntdll.dll
    Symbol Type: PDB      - Symbols loaded successfully from image path.
                 d:\symbols\ntdll.pdb\744D7B497B81470CA2D8A8D262FC8A292\ntdll.pdb
    Load Report: public symbols , not source indexed 
                 d:\symbols\ntdll.pdb\744D7B497B81470CA2D8A8D262FC8A292\ntdll.pdb

{% endcodeblock %}
				 
再来看看Windbg匹配ntdll.pdb的真实路径，d:\symbols\ntdll.pdb\744D7B497B81470CA2D8A8D262FC8A292\ntdll.pdb。对比一下就可以发现其中的奥秘。原来Windbg识别执行程序的PDB路径是依赖guid，age和PdbFileName。具体来说就是 {符号设置路径}\{PdbFileName}\{guid}{age}\{PdbFileName}。
如果想写程序获取这些信息并不需要像上面那样解析PE文件结构，实际上微软给我们提供了这方面的支持，在dbghelp.dll里导出了一个叫做SymSrvGetFileIndexInfo的函数，这个函数获得的SYMSRV_INDEX_INFO结构中，就包含以上我们需要的数据。
