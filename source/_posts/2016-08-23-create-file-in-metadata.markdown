---
author: admin
comments: true
date: 2016-08-23 11:58:00+00:00
layout: post
slug: 'create-file-in-metadata'
title: 在NTFS元文件目录里创建文件
categories:
- Tips
---

说到Rootkit就不能提到他的文件隐藏，Rootkit隐藏文件的方式千奇百怪，这里说其中一个通过NTFS元文件目录无法被普通程序显示的特性隐藏文件的方法。

我们都知道NTFS是有元文件的，比如$MFT(NTFS主文件表)，这种文件是我们看不到的，但是系统能访问。同样还有一种元文件目录，这个目录也是看不到的，无论你是否打开了显示系统文件，隐藏文件的选项。那么如果我们把要隐藏的文件放在这种目录下，那么就达到了隐藏的效果。

举个例子 $Extend\\$RmMetadata 这个目录。我们可以通过Winhex解析NTFS来读取这个目录的情况，而普通程序不行。这里我们通过这样的代码来创建文件。

{% codeblock lang:cpp %}
#define GPA(x) *(FARPROC *)&My##x = GetProcAddress(GetModuleHandle(L"ntdll.dll"), #x)	
	GPA(NtCreateFile);
	GPA(RtlInitUnicodeString);
	IO_STATUS_BLOCK iob;
	HANDLE h;
	UNICODE_STRING uni_str;
	MyRtlInitUnicodeString(&uni_str, L"\\??\\Global\\D:\\$Extend\\$RmMetadata\\$0cch");

	OBJECT_ATTRIBUTES oa;
	InitializeObjectAttributes(&oa, &uni_str, OBJ_CASE_INSENSITIVE | OBJ_KERNEL_HANDLE, NULL, NULL)

	LONG l = MyNtCreateFile(&h, 
	FILE_APPEND_DATA | SYNCHRONIZE, 
	&oa, 
	&iob, 
	0, 
	FILE_ATTRIBUTE_HIDDEN | FILE_ATTRIBUTE_SYSTEM, 
	0, 
	FILE_SUPERSEDE, 
	FILE_SYNCHRONOUS_IO_NONALERT | FILE_NON_DIRECTORY_FILE, 
	NULL, 
	0);
	
	char buffer[] = "0123456789";
	WriteFile(h, buffer, strlen(buffer), (ULONG *)&l, NULL);

	CloseHandle(h);
{% endcodeblock %}

值得注意的是我们必须用System用户权限去运行这个程序，才能创建文件到元文件目录，这里要用到psexec：

psexec  -s C:\0cch\Test.exe

然后我们看看效果

[![20160824115523](/uploads/2016/08/20160824115523.png)](/uploads/2016/08/20160824115523.png)
