---
author: admin
comments: true
layout: post
slug: 'printer api tip'
title: 打印机API相关的一点记录
date: 2019-09-03 20:01:29
categories:
- Tips
---

最近研究了一点Windows上打印相关的内容，发现打印这块的东西的确挺多的。比如纸张，分辨率，打印处理器，打印数据类型等等。

首先我们需要通过`EnumPrintersW`枚举打印机，为了方便我写了一个简单的类模板：

``` c++
template<class T = PRINTER_INFO_2, int level = 2>
class CEnumPrinter {
public:
	void Init(ULONG flags)
	{
		ULONG bytes_needed = 0;
		ULONG elems_returned = 0;
		EnumPrintersW(flags, nullptr, level, nullptr, 0, &bytes_needed, &elems_returned);
		buffer_.resize(bytes_needed);
		EnumPrintersW(flags, nullptr, level, buffer_.data(), bytes_needed, &bytes_needed, &elems_returned);
		elems_returned_ = elems_returned;
	}

	ULONG Count()
	{
		return elems_returned_;
	}

	const T& operator[] (ULONG idx)
	{
		assert(idx < elems_returned_);
		return reinterpret_cast<T*>(buffer_.data())[idx];
	}

private:
	std::vector<UCHAR> buffer_;
	ULONG elems_returned_ = 0;
};
```

在枚举和选择目标打印机之后可以通过`PRINTER_INFO_2`中的`pPrinterName`获得打印机句柄。为了方便也写了一个类：

``` c++
class CPrinterHandle {
public:
	~CPrinterHandle() 
	{
		Close();
	}

	bool Open(LPCWSTR printer_name)
	{
		std::vector<WCHAR> name;
		name.resize(wcslen(printer_name) + 1);
		wcscpy_s(name.data(), name.size(), printer_name);
		return OpenPrinter(name.data(), &printer_, nullptr);
	}

	HANDLE Detach()
	{
		HANDLE h = printer_;
		printer_ = nullptr;
		return h;
	}

	HANDLE Attach(HANDLE printer)
	{
		HANDLE h = printer_;
		printer_ = printer;
		return h;
	}

	void Close()
	{
		if (printer_) {
			ClosePrinter(printer_);
			printer_ = nullptr;
		}
	}

	operator HANDLE() const
	{
		return printer_;
	}

private:
	HANDLE printer_ = nullptr;
};
```

而通过这个句柄就可以做很多的事情了，比如获取打印机的具体配置，弹出打印机属性对话框等等，这里以获取其支持的纸张类型为例：

``` c++

template<class T = FORM_INFO_1, int level = 1>
class CEnumPrinterForm {
public:
	void Init(HANDLE hp)
	{
		ULONG bytes_needed = 0;
		ULONG elems_returned = 0;
		EnumForms(hp, level, NULL, 0, &bytes_needed, &elems_returned);
		buffer_.resize(bytes_needed);
		EnumForms(hp, level, buffer_.data(), bytes_needed, &bytes_needed, &elems_returned);
		elems_returned_ = elems_returned;
	}

	ULONG Count()
	{
		return elems_returned_;
	}

	const T& operator[] (ULONG idx)
	{
		assert(idx < elems_returned_);
		return reinterpret_cast<T*>(buffer_.data())[idx];
	}

private:
	std::vector<UCHAR> buffer_;
	ULONG elems_returned_ = 0;
};
```

可以枚举出类似A3、A4、B5这种纸张类型。不过这套打印数据的函数有一些不太友好，因为通过打印机句柄打印数据，我们只能传输emf或者raw格式的数据。而我们比较熟悉的方法是通过DC绘制图形并且打印，这样所见即所得用起来会更舒适。不过，这套API没有提供用打印机句柄转换到HDC的方法。只能通过`PRINTER_INFO_2`中的`pPrinterName`和`pDevMode`重新打开一个HDC，然后通过HDC相关的API进行打印。例如：

``` c++
hdc = CreateDCW(NULL, info.pPrinterName, NULL, info.pDevMode);
DOCINFO docInfo = {0};
docInfo.cbSize = sizeof(docInfo);
docInfo.lpszDocName = L"test";

RECT rc = { 40, 10 };

StartDoc(hdc, &docInfo);
StartPage(hdc);
DrawTextA(hdc, "hello", -1, &rc, DT_SINGLELINE | DT_NOCLIP);
EndPage(hdc);
StartPage(hdc);
DrawTextA(hdc, "world", -1, &rc, DT_SINGLELINE | DT_NOCLIP);
EndPage(hdc);
EndDoc(hdc);
```