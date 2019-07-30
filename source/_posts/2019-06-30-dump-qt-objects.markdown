---
author: admin
comments: true
layout: post
slug: 'dump qt objects'
title: Dump QT objects
date: 2019-06-30 11:14:09
categories:
- Tips
---

在QT中，QObject有两个函数`dumpObjectInfo()`和`dumpObjectTree() `分别用于dump相关对象树形结构和相关的连接信息。不过这两个函数有个共同的问题，只能在debug模式下使用。因为在Release模式下，这两个函数不做任何事情：

``` c++
static void dumpRecursive(int level, QObject *object)
{
#if defined(QT_DEBUG)
    ...
#else
    Q_UNUSED(level)
    Q_UNUSED(object)
#endif
}

void QObject::dumpObjectTree()
{
    dumpRecursive(0, this);
}

void QObject::dumpObjectInfo()
{
#if defined(QT_DEBUG)
    ...
#endif
}
```

为了能在Release模式下使用这两个函数，其中一个办法是删除`#if defined(QT_DEBUG)`宏，然后重新编译qtcore4.dll。不过重新编译QT需要一些准备工作，而且还需要较长的一段编译时间，所以我果断放弃了这种方法。

第二种想到的方法是自己实现`dumpObjectInfo()`和`dumpObjectTree() `这两个函数。实际上，实现`dumpObjectTree()`并不是一件难事，`qDebug()`本身就能dump QObject了，我们需要做的就是递归遍历对象节点：

``` c++
static void dumpObjects(const QObjectList &objs, int nIndent = 0)
{
	QString strIndent;
	for (int i = 0; i < nIndent; i++) {
		strIndent.append("  ");
	}
	Q_FOREACH(const QObject *obj, objs)
	{
		qDebug() << strIndent.toAscii().data() << obj;
		if (!obj->children().isEmpty()) {
			dumpObjects(obj->children(), nIndent + 1);
		}
	}
}
```

在想要遍历QT对象时，我们只需要将对象的子节点列表传入函数即可：

``` c++
QMsgTest w;
dumpObjects(w.children());
```

输出的数据如下：

```
QMainWindowLayout(0x36ba208, name = "_layout") 
 QRubberBand(0x36ba778, name = "qt_rubberband") 
 QMenuBar(0x36bab78, name = "menuBar") 
   QToolButton(0x36bae88, name = "qt_menubar_ext_button") 
 QToolBar(0x36bb820, name = "mainToolBar") 
   QToolBarLayout(0x36bbb50) 
   QToolBarExtension(0x36bbc80, name = "qt_toolbar_ext_button") 
   QAction(0x36bc5a0) 
   QPropertyAnimation(0x36bcf90) 
   QPropertyAnimation(0x35098f8) 
 QWidget(0x36bcac0, name = "centralWidget") 
   QPropertyAnimation(0x36bbed8) 
   QPropertyAnimation(0x3509cf0) 
 QStatusBar(0x36bcd70, name = "statusBar") 
   QSizeGrip(0x36bbac0) 
   QHBoxLayout(0x36b3ad0) 
     QVBoxLayout(0x36bd5d8) 
       QHBoxLayout(0x36bd818) 
```



怎么样，是不是很容易实现。不过接下来就要泼一盆冷水了，因为`dumpObjectInfo()`函数就没有那么容易实现了。主要原因是`dumpObjectInfo()`函数中有大量的依赖关系，如果单纯的扣代码过来牵扯会非常广，所以这个方法似乎也进行不下去了。

最后，我想到了第三种方法，在Release模式下加载Debug版本的qtcored4.dll，获取其函数地址并且直接调用它。

``` c++
PVOID dumpFunc = NULL;
void* (*myInstallMsgHandler)(void* h) = NULL

void myMsgHandler(QtMsgType t, const char* str)
{
	OutputDebugStringW(QString("%1\n").arg(str).utf16());
}

void Init()
{
    HMODULE h = LoadLibraryW(L"qtcored4.dll");
	dumpFunc = GetProcAddress(h, "?dumpObjectInfo@QObject@@QAEXXZ");
    *(void **)&myInstallMsgHandler = GetProcAddress(h, "?qInstallMsgHandler@@YAP6AXW4QtMsgType@@PBD@ZP6AX01@Z@Z");
    myInstallMsgHandler(myMsgHandler);
}

void dumpObjInfo(void *obj)
{
	__asm {
		mov ecx, obj
		call dumpFunc;
	}
}

int main(int argc, char *argv[])
{
	Init();

	QApplication a(argc, argv);
	QMsgTest w;
	w.show();
	dumpObjInfo(&w);
	return a.exec();
}

```

解释一下这段代码，首先Init函数是用来加载qtcored4.dll以及初始化相关的函数，这里GetProcAddress获取的函数分别是`qInstallMsgHandler`和`dumpObjectInfo`，之所以代码中的函数名这么复杂是因为C++使用的Decorated Name规则导致的，可以用一些PE工具查看导出函数来获取这个名字。另外我们看到，出了获取`dumpObjectInfo`函数外，还获取了`qInstallMsgHandler`函数。因为我们需要使用这个函数注册输出调试信息的函数，在代码中是`myMsgHandler`。最后，为了方便的调用`dumpObjectInfo`的函数指针，我采用了内嵌汇编的方式。因为`dumpObjectInfo`是成员函数，所以肯定是thiscall，于是将obj赋予ecx寄存器并且调用函数指针即可。

编译运行可以看到输出结果：

```
BJECT QMsgTest::QMsgTestClass
  SIGNALS OUT
        signal: destroyed(QObject*)
        signal: destroyed()
        signal: customContextMenuRequested(QPoint)
        signal: iconSizeChanged(QSize)
          --> QToolBar::mainToolBar _q_updateIconSize(QSize)
        signal: toolButtonStyleChanged(Qt::ToolButtonStyle)
          --> QToolBar::mainToolBar _q_updateToolButtonStyle(Qt::ToolButtonStyle)
  SIGNALS IN
        <None>
```

当然了，内嵌汇编不是一个好的代码风格，这里只是为了快速验证方案的可行性。更符合C++语法习惯的方式应该是声明一个成员函数指针，然后用`GetProcAddress`获取对应的函数地址对其赋值，最后调用成员函数指针。具体怎么实现仁者见仁智者见智，我这篇blog只是抛砖引玉。

