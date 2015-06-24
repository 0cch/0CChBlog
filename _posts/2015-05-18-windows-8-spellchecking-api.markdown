---
author: admin
comments: true
date: 2015-05-18 12:30:35+00:00
layout: post
slug: windows-8-spellchecking-api
title: Windows 8 SpellChecking API
wordpress_id: 558
categories:
- Tips
---

在Windows 8下，多了一套很有趣的API，SpellChecking，这套API的作用也是一目了然，是做拼写检查的。这么有趣的一套API怎么能不写个程序玩玩呢，于是我写了个小程序，看了看对英文拼写检查的效果，如图。
[![20150518202121](/uploads/2015/05/20150518202121.png)](/uploads/2015/05/20150518202121.png)
拼写检查会给出三个结果，分别是删除，替换和建议，根据不同的结果我们可以调用不同的接口来获得最佳的体验。代码如下：

{% highlight cpp %}
// SpellCheck.cpp : Defines the entry point for the console application.
//

#include "stdafx.h"
#include <atlbase.h>
#include <atlstr.h>
#include <Spellcheck.h>
class CCoInitialize {
public:
	CCoInitialize() {
		CoInitializeEx(NULL, COINIT_MULTITHREADED);
	}
	~CCoInitialize() { CoUninitialize(); }
};

LPCWSTR kActionStrings[] = {
	L"CORRECTIVE_ACTION_NONE",
	L"CORRECTIVE_ACTION_GET_SUGGESTIONS",
	L"CORRECTIVE_ACTION_REPLACE",
	L"CORRECTIVE_ACTION_DELETE"
};

int _tmain(int argc, _TCHAR* argv[])
{
	CCoInitialize com_init;
	CComPtr spell_checker_factory;
	HRESULT hr = CoCreateInstance(__uuidof(SpellCheckerFactory), NULL, CLSCTX_INPROC_SERVER, __uuidof(spell_checker_factory),
		reinterpret_cast(&spell;_checker_factory));
	if (FAILED(hr)) {
		return 1;
	}

	LPCWSTR lang_tag = L"en-US";
	BOOL suppored = FALSE;
	spell_checker_factory->IsSupported(lang_tag, &suppored;);
	if (!suppored) {
		return 1;
	}

	CComPtr spell_checker;
	hr = spell_checker_factory->CreateSpellChecker(lang_tag, &spell;_checker);
	if (FAILED(hr)) {
		return 1;
	}

	WCHAR my_text[] = L"Helloo world, I am am new heere, hvae fun";
	wprintf(L"%s\n\n", my_text);
	CComPtr spell_errors;
	hr = spell_checker->Check(my_text, &spell;_errors);
	if (FAILED(hr)) {
		return 1;
	}

	CComPtr spell_error;
	while (spell_errors->Next(&spell;_error) == S_OK) {
		ULONG index, length;
		if (SUCCEEDED(spell_error->get_StartIndex(&index;)) && SUCCEEDED(spell_error->get_Length(&length;))) {
			CStringW tmp_str(my_text + index, length);
			wprintf(L"%-10s    ", tmp_str.GetString());

			CORRECTIVE_ACTION action;
			if (SUCCEEDED(spell_error->get_CorrectiveAction(&action;))) {
				wprintf(L"%-40s    ", kActionStrings[action]);
			}

			if (action == CORRECTIVE_ACTION_DELETE) {
				wprintf(L"delete %s\n", tmp_str.GetString());
			}
			else if (action == CORRECTIVE_ACTION_GET_SUGGESTIONS) {
				CComPtr spell_suggestions;
				hr = spell_checker->Suggest(tmp_str.GetString(), &spell;_suggestions);
				if (FAILED(hr)) {
					break;;
				}

				WCHAR *suggestion_str;
				while (spell_suggestions->Next(1, &suggestion;_str, NULL) == S_OK) {
					wprintf(L"%s ", suggestion_str);
					CoTaskMemFree(suggestion_str);
				}
				wprintf(L"\n");
			}
			else if (action == CORRECTIVE_ACTION_REPLACE) {
				WCHAR *replace_str;
				hr = spell_error->get_Replacement(&replace;_str);
				wprintf(L"%s\n", replace_str);
				CoTaskMemFree(replace_str);
			}
		}

		spell_error.Release();
	}

	return 0;
}


 {% endhighlight %}
