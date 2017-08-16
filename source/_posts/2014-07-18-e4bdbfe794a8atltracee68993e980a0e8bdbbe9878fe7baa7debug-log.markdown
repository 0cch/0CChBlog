---
author: admin
comments: true
date: 2014-07-18 03:17:48+00:00
layout: post
slug: '%e4%bd%bf%e7%94%a8atltrace%e6%89%93%e9%80%a0%e8%bd%bb%e9%87%8f%e7%ba%a7debug-log'
title: 使用ATLTRACE打造轻量级Debug Log
wordpress_id: 457
categories:
- Debugging
- Tips
---

众所周知，Debug Log是非常好的调试手段。所以我经常也尝试各种各样的第三方Log库。Log库分很多类型，例如可以给服务器使用的功能完备Log，也有轻量级的Log库，只是为Debug所设计。作为客户端开发，我还是比较喜欢后者这种Log库。不过使用第三方库有一个这样的麻烦事，走到哪你都得下一个，然后添加到自己的代码里。对于Log这样的功能，几乎所有程序都是需要的，使用的极其频繁。所以我就想找到一种方法，它可以使用SDK现有功能，来完成一个轻量级Log的功能。对我来说，不需要这个Log有多么高效，完备，唯一需要的就是方便，拿来就可以用。

结合这些目的，我第一个想到的就是ATL的ATLTRACE。但是，ATLTRACE输出的日志都是显示在Debug Output窗口。如果想将信息输出到文件或者控制台上，这就够呛了。那么，接下来就要想办法改变ATLTRACE的输出设备了。由于ATL是有代码的，所以很容易的可以看到代码运行的脉络。看完这份代码的第一个收获就是知道了ATLTRACE运行效率不会很高，不过这个对我来说并不重要。另外一个就是，找到了改变输出设备的方法。

在没有定义_ATL_NO_DEBUG_CRT的情况下，ATLTRACE最终的输出是通过_CrtDbgReport实现的，而如果定义了这个宏，那么输出是直接调用OutputDebugString。但一般程序都不会使用_ATL_NO_DEBUG_CRT这个宏，所以大部分情况下ATLTRACE都是调用的_CrtDbgReport。那么办法就来了_CrtDbgReport输出的数据，是可以通过_CrtSetReportMode和_CrtSetReportFile来改变输出设备的。例如我们想输出到控制台，我们只需要这样：  
_CrtSetReportMode(_CRT_WARN, _CRTDBG_MODE_FILE);  
_CrtSetReportFile(_CRT_WARN, _CRTDBG_FILE_STDOUT);  

如果要输出到文件也只需要这样：  
HANDLE log_file;  
log_file = CreateFile("c:\\log.txt", GENERIC_WRITE,   
	FILE_SHARE_WRITE, NULL, CREATE_ALWAYS,   
	FILE_ATTRIBUTE_NORMAL, NULL);  
_CrtSetReportFile(_CRT_WARN, log_file);  
CloseHandle(log_file);  
或者  
freopen( "c:\\log2.txt", "w", stdout);  
_CrtSetReportMode(_CRT_ERROR, _CRTDBG_MODE_FILE);  
_CrtSetReportFile(_CRT_ERROR, _CRTDBG_FILE_STDOUT);  

好了，这样就能解决输出设备的问题。既然已经说到这里，继续介绍下ATLTRACE很少人知道的其他优点吧。  
1.可以通过ATL/MFT TRACE Tool 随时设定Log的输出Filter，并且可以保持配置（工具用法很简单，具体直接用用就知道了）。  
2.通过AtlDebugAPI的接口，可以给自己的代码中添加读取配置文件的函数。这样每次修改配置文件就能改变ATLTRACE的行为。  
3.通过AtlDebugAPI的接口，可以直接制定输出内容，不用配置文件也可以。  
这三条涉及到的接口有：  
AtlTraceOpenProcess  
AtlTraceModifyProcess  
AtlTraceCloseProcess  
AtlTraceLoadSettings  

为了更方便使用，我这写了几个宏代码如下：

{% codeblock lang:cpp %}
#include <atlbase.h>
#include <atltrace.h>
#include <atldebugapi.h>
#include <atlpath.h>

#define TRACEHELPA(fmt, ...)	\
do								\
{								\
	SYSTEMTIME tm;				\
	GetLocalTime(&tm;);			\
	ATLTRACE("%s: [%02d-%02d-%02d %02d:%02d:%02d:%03d] "fmt, __FUNCTION__,							\
	tm.wYear, tm.wMonth, tm.wDay, tm.wHour, tm.wMinute, tm.wSecond, tm.wMilliseconds, __VA_ARGS__);	\
} while (0)

#define TRACEHELPW(fmt, ...)	\
do								\
{								\
	SYSTEMTIME tm;				\
	GetLocalTime(&tm;);			\
	ATLTRACE(L"%S: [%02d-%02d-%02d %02d:%02d:%02d:%03d] "fmt, __FUNCTION__,							\
	tm.wYear, tm.wMonth, tm.wDay, tm.wHour, tm.wMinute, tm.wSecond, tm.wMilliseconds, __VA_ARGS__);	\
} while (0)

#define TRACEHELPEXA(category, level, fmt, ...)	\
do								\
{								\
	SYSTEMTIME tm;				\
	GetLocalTime(&tm;);			\
	ATLTRACE(category, level, "%s: [%02d-%02d-%02d %02d:%02d:%02d:%03d] "fmt, __FUNCTION__,			\
	tm.wYear, tm.wMonth, tm.wDay, tm.wHour, tm.wMinute, tm.wSecond, tm.wMilliseconds, __VA_ARGS__);	\
} while (0)

#define TRACEHELPEXW(category, level, fmt, ...)	\
do								\
{								\
	SYSTEMTIME tm;				\
	GetLocalTime(&tm;);			\
	ATLTRACE(category, level, L"%S: [%02d-%02d-%02d %02d:%02d:%02d:%03d] "fmt, __FUNCTION__,		\
	tm.wYear, tm.wMonth, tm.wDay, tm.wHour, tm.wMinute, tm.wSecond, tm.wMilliseconds, __VA_ARGS__);	\
} while (0)

#define SetAtlTraceOpt(level, enable, category, filename_lineno, report_type, report_file)	\
do																							\
{																							\
	DWORD_PTR trace_process = AtlTraceOpenProcess(GetCurrentProcessId());					\
	AtlTraceModifyProcess(trace_process, level, enable, category, filename_lineno);			\
	AtlTraceCloseProcess(trace_process);													\
	_CrtSetReportMode(level, report_type);													\
	if (report_type == _CRTDBG_MODE_FILE) {													\
		_CrtSetReportFile(level, report_file);												\
	}																						\
} while (0)

#define LoadAtlDebugCfgExA(path)															\
do																							\
{																							\
	DWORD_PTR trace_process = AtlTraceOpenProcess(GetCurrentProcessId());					\
	AtlTraceLoadSettingsA(path, trace_process);												\
	AtlTraceCloseProcess(trace_process);													\
} while (0)

#define LoadAtlDebugCfgExW(path)															\
do																							\
{																							\
	DWORD_PTR trace_process = AtlTraceOpenProcess(GetCurrentProcessId());					\
	AtlTraceLoadSettingsU(path, trace_process);												\
	AtlTraceCloseProcess(trace_process);													\
} while (0)

#define LoadAtlDebugCfgA()																	\
do																							\
{																							\
	CHAR debug_cfg_path[MAX_PATH] = {0};													\
	GetModuleFileNameA(NULL, debug_cfg_path, MAX_PATH);										\
	CPathA debug_cfg_path_obj(debug_cfg_path);												\
	debug_cfg_path_obj.RemoveExtension();													\
	debug_cfg_path_obj.AddExtension(".trc");												\
	LoadAtlDebugCfgExA(debug_cfg_path_obj.m_strPath.GetString());							\
} while (0)

#define LoadAtlDebugCfgW()																	\
do																							\
{																							\
	WCHAR debug_cfg_path[MAX_PATH] = {0};													\
	GetModuleFileNameW(NULL, debug_cfg_path, MAX_PATH);										\
	CPathW debug_cfg_path_obj(debug_cfg_path);												\
	debug_cfg_path_obj.RemoveExtension();													\
	debug_cfg_path_obj.AddExtension(L".trc");												\
	LoadAtlDebugCfgExW(debug_cfg_path_obj.m_strPath.GetString());							\
} while (0)

int _tmain(int argc, _TCHAR* argv[])
{

	SetAtlTraceOpt(_CRT_WARN, true, true, true, _CRTDBG_MODE_FILE, _CRTDBG_FILE_STDOUT);
	LoadAtlDebugCfgW();
	CTraceCategory MY_CATEGORY(_T("MyCategoryName"));
	TRACEHELPEXA(MY_CATEGORY, 0, "test test test\n");
	TRACEHELPEXW(MY_CATEGORY, 0, L"test test test\n");
	return 0;
}
 {% endcodeblock %}

