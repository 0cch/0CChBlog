---
author: admin
comments: true
date: 2015-08-27 12:04:23+00:00
layout: post
slug: '3-interesting-API'
title: 介绍三个有趣的API
categories:
- Tips
---

####PickIconDlg

相信给快捷方式指定过图标的朋友肯定看过一个这样的对话框吧，如果你看到过，你肯定已经知道了这个API是怎么一回事。这个API会弹出一个选择图标的窗口给你选择，确定后返回图标在资源中的索引值。这样你可以通过这个索引值和ExtractIcon函数获得这个图标的句柄。

[![20150827113011](/uploads/2015/08/20150827113011.png)](/uploads/2015/08/20150827113011.png)

示例代码如下：

{% highlight c++ %}
int Index = 2;
const DWORD BuffSize = MAX_PATH;
TCHAR Path[BuffSize] = _T("c:\\windows\\system32\\shell32.dll");
const int Sel = PickIconDlg(NULL, Path, BuffSize, &Index);
if(Sel)
{
	HMODULE hMod = ::LoadLibrary(Path);
	HICON hIcon = ExtractIcon(hMod, Path, Index);
	FreeLibrary(hMod);
}
{% endhighlight %}
-------------------

####WNetConnectionDialog和WNetConnectionDialog1

这两个函数是帮助我们在程序中显示映射网络驱动器对话框的，虽然用的不多，但是也应该见到过它。这两个函数区别不大，只不过WNetConnectionDialog1比WNetConnectionDialog提供了更多的参数去设置。

[![20150827114516](/uploads/2015/08/20150827114516.png)](/uploads/2015/08/20150827114516.png)

示例代码如下：

{% highlight c++ %}
#pragma comment(lib, "Mpr.lib")

CONNECTDLGSTRUCT condlg = { 0 };
condlg.cbStructure = sizeof(condlg);
condlg.hwndOwner = GetConsoleWindow();
condlg.dwFlags =  CONNDLG_USE_MRU;

NETRESOURCE nr = { 0 };
nr.dwScope = RESOURCE_GLOBALNET;
nr.dwType = RESOURCETYPE_DISK;
nr.lpRemoteName = NULL;
nr.dwDisplayType = RESOURCEDISPLAYTYPE_DOMAIN;

condlg.lpConnRes = &nr;

const int RetVal = WNetConnectionDialog1(&condlg);
{% endhighlight %}

---------------------

####SHOpenWithDialog

这个API所显示的对话框我们应该是最多见的，它显示了一个打开方式的对话框。不过有点可惜的是，XP并不支持这个API，我们只能将它用在Vista开始的系统上。

[![20150827115225](/uploads/2015/08/20150827115225.png)](/uploads/2015/08/20150827115225.png)

示例代码如下：

{% highlight c++ %}
OPENASINFO Info = { 0 };
Info.pcszFile = _T("C:\\Windows\\win.ini");
Info.oaifInFlags = OAIF_EXEC | OAIF_ALLOW_REGISTRATION;
SHOpenWithDialog(NULL, &Info);
{% endhighlight %}
