---
author: admin
comments: true
date: 2013-01-19 07:52:28+00:00
layout: post
slug: ntfsstudy-ntfs%e7%a3%81%e7%9b%98%e6%a0%bc%e5%bc%8f%e5%ad%a6%e4%b9%a0%e5%b7%a5%e5%85%b7
title: NtfsStudy —— ntfs磁盘格式学习工具
wordpress_id: 117
categories:
- NTInternals
---

经过将近一个月业余时间的开发，终于完成了NtfsStudy这个小工具的第一版。

简单介绍一下这个工具，NtfsStudy这个工具是我在学习Ntfs文件系统磁盘格式的时候，为了自己更加方便快捷的查看磁盘格式而开发的工具。可以说这个工具从开始写到现在发布，实际上也是一个学习ntfs的过程。我一边研究理解这个格式，一边把理解的东西写成代码，加入这个工具，然后再用这些功能去理解新的内容。反复这样做，这个工具就也不知不觉成型了。

NtfsStudy这个工具的主要功能是：枚举目录文件，查看和dump文件属性。这些功能都没用调用windows 文件操作类的API完成，而是依靠直接读取磁盘信息，并且解析磁盘信息来完成的。例如，如果尝试去复制注册表的系统hive文件，那是一定会被系统拒绝的，这个文件是系统读写独占的，但是通过这个工具就能绕过“ntfsstudy.exe -f c:\ -r e0a2 -w 3 d:\system.hiv”， 这个命令行的意思是把volume C上的引用数为0xe0a2文件中的3号属性的内容写到d:\system.hiv文件中。其实id为3的属性正好就是data属性，也就是文件本身的内容。这样就可以dump不能读的注册表hive文件了。下面是“ntfsstudy.exe -f c:\ -r e0a2 -d 8”的结果：

[![ntfs_hive](/uploads/2013/01/ntfs_hive.png)](/uploads/2013/01/ntfs_hive.png)

更多的详细用法和例子等我有空会在blog里面写一些。

下面就是他的Usage，也是目前该工具具有的功能。

{% codeblock lang:windbg %}
NtfsStudy v1.0 - Ntfs format study tool.
Copyright (C) 2012-2013 nightxie
0CCh - www.0cch.net

Usage : NtfsStudy.exe [options] -f file_path_name
-f file_path_name Specifies the target file path to parse.

options:


[-r file_reference]   Specifies the target file reference.
NtfsStudy will parse the REFERENCE rather than the path which
Specifies by -f. NtfsStudy will just use the path root.
[-a] Show the file record information of the target file.
[-l]   List the files in the directory.
[-w attribute_id output_file_path] Write target attribute to a file.
(The attribute size must less than 128mb)
[-v attribute_type] Show detail attribute information specified by attribute_type.
[-d attribute_type [start_offset range]] Show binary information specified by attribute_type.
[-s secure_id] Show the security descriptor specified by secure_id.
[-c] Show the attributes definition columns.


About attribute type:


$STANDARD_INFORMATION         = 1
$ATTRIBUTE_LIST               = 2
$FILE_NAME                    = 3
$OBJECT_ID                    = 4
$SECURITY_DESCRIPTOR          = 5
$VOLUME_NAME                  = 6
$VOLUME_INFORMATION           = 7
$DATA                         = 8
$INDEX_ROOT                   = 9
$INDEX_ALLOCATION             = 10
$BITMAP                       = 11
$REPARSE_POINT                = 12
$EA_INFORMATION               = 13
$EA                           = 14
$LOGGED_UTILITY_STREAM        = 16

About secure id:

To get the secure id of target file.
Use '-v 1' command, secure id will displayed in STANDARD_INFORMATION.
{% endcodeblock %}

另外我还会继续完善这个工具。如果发现bug请与我联系。

下载[NtfsStudy](/uploads/2013/01/NtfsStudy.zip)
