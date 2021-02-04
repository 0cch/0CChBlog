---
author: admin
comments: true
layout: post
slug: 'msvc build qt5.15.2 error'
title: 解决vs2019编译qt5.15.2的错误
date: 2021-02-03 11:37:28
categories:
- CPP
---

记录一下编译qt-everywhere-src-5.15.2中qtwebengine遇到的问题。

第一、在windows上用vs2019编译qtwebengine的时候需要patch其中的3个文件，否则会报错。错误看起来好像是：

```
ninja: build stopped: subcommand failed. 
NMAKE : fatal error U1077: 'call' : return code '0x1'
NMAKE : fatal error U1077: '"...\nmake.exe"' : return code '0x2' Stop.
NMAKE : fatal error U1077: '(' : return code '0x2' Stop.
NMAKE : fatal error U1077: 'cd' : return code '0x2' Stop.
NMAKE : fatal error U1077: 'cd' : return code '0x2' Stop
```

但实际问题是代码在vs2019的cl里编译出错了，C4244警告被当成错误报出：

```
FAILED: obj/third_party/angle/angle_common/mathutil.obj
...
../../3rdparty/chromium/third_party/angle/src/common/mathutil.cpp(75): error C4244: '=': conversion from 'double' to 'float', possible loss of data
../../3rdparty/chromium/third_party/angle/src/common/mathutil.cpp(77): error C4244: '=': conversion from 'double' to 'float', possible loss of data
../../3rdparty/chromium/third_party/angle/src/common/mathutil.cpp(79): error C4244: '=': conversion from 'double' to 'float', possible loss of data
```

所以需要打个补丁，手动修改也行吧，代码量很少：
[https://codereview.qt-project.org/c/qt/qtwebengine-chromium/+/321741](https://codereview.qt-project.org/c/qt/qtwebengine-chromium/+/321741)

```
From 138a7203f16cf356e9d4dac697920a22437014b0 Mon Sep 17 00:00:00 2001
From: Peter Varga <pvarga@inf.u-szeged.hu>
Date: Fri, 13 Nov 2020 11:09:23 +0100
Subject: [PATCH] Fix build with msvc2019 16.8.0


Fixes: QTBUG-88708
Change-Id: I3554ceec0437801b4861f68edd504d01fc01cf93
Reviewed-by: Allan Sandfeld Jensen <allan.jensen@qt.io>
---


diff --git a/chromium/third_party/angle/src/common/mathutil.cpp b/chromium/third_party/angle/src/common/mathutil.cpp
index 306cde1..d4f1034 100644
--- a/chromium/third_party/angle/src/common/mathutil.cpp
+++ b/chromium/third_party/angle/src/common/mathutil.cpp
@@ -72,11 +72,11 @@
     const RGB9E5Data *inputData = reinterpret_cast<const RGB9E5Data *>(&input);
     *red =
-        inputData->R * pow(2.0f, (int)inputData->E - g_sharedexp_bias - g_sharedexp_mantissabits);
+        inputData->R * (float)pow(2.0f, (int)inputData->E - g_sharedexp_bias - g_sharedexp_mantissabits);
     *green =
-        inputData->G * pow(2.0f, (int)inputData->E - g_sharedexp_bias - g_sharedexp_mantissabits);
+        inputData->G * (float)pow(2.0f, (int)inputData->E - g_sharedexp_bias - g_sharedexp_mantissabits);
     *blue =
-        inputData->B * pow(2.0f, (int)inputData->E - g_sharedexp_bias - g_sharedexp_mantissabits);
+        inputData->B * (float)pow(2.0f, (int)inputData->E - g_sharedexp_bias - g_sharedexp_mantissabits);
}
}  // namespace gl
diff --git a/chromium/third_party/blink/renderer/platform/graphics/lab_color_space.h b/chromium/third_party/blink/renderer/platform/graphics/lab_color_space.h
index 78c316e..136c796 100644
--- a/chromium/third_party/blink/renderer/platform/graphics/lab_color_space.h
+++ b/chromium/third_party/blink/renderer/platform/graphics/lab_color_space.h
@@ -130,7 +130,7 @@
   // https://en.wikipedia.org/wiki/CIELAB_color_space#Forward_transformation.
   FloatPoint3D toXYZ(const FloatPoint3D& lab) const {
     auto invf = [](float x) {
-      return x > kSigma ? pow(x, 3) : 3 * kSigma2 * (x - 4.0f / 29.0f);
+      return x > kSigma ? (float)pow(x, 3) : 3 * kSigma2 * (x - 4.0f / 29.0f);
     };
     FloatPoint3D v = {clamp(lab.X(), 0.0f, 100.0f),
diff --git a/chromium/third_party/perfetto/src/trace_processor/timestamped_trace_piece.h b/chromium/third_party/perfetto/src/trace_processor/timestamped_trace_piece.h
index 02363d0..8860287 100644
--- a/chromium/third_party/perfetto/src/trace_processor/timestamped_trace_piece.h
+++ b/chromium/third_party/perfetto/src/trace_processor/timestamped_trace_piece.h
@@ -198,6 +198,20 @@
     return *this;
   }
+#if PERFETTO_BUILDFLAG(PERFETTO_COMPILER_MSVC)
+  TimestampedTracePiece& operator=(TimestampedTracePiece&& ttp) const
+  {
+    if (this != &ttp) {
+      // First invoke the destructor and then invoke the move constructor
+      // inline via placement-new to implement move-assignment.
+      this->~TimestampedTracePiece();
+      new (const_cast<TimestampedTracePiece*>(this)) TimestampedTracePiece(std::move(ttp));
+    }
+
+    return const_cast<TimestampedTracePiece&>(*this);
+  }
+#endif  // PERFETTO_BUILDFLAG(PERFETTO_COMPILER_MSVC)
+
   ~TimestampedTracePiece() {
     switch (type) {
       case Type::kInvalid:

```

第二、在Windows上编译blink的pch也会有些问题，报错找不到头文件：

```
qt5/qtwebengine/src/3rdparty/chromium/third_party/WebKit/Source/core/win/Precompile-core.cpp: fatal error C1083: Cannot open include file: 
'../../../../../qt5srcgit/qt5/qtwebengine/src/3rdparty/chromium/third_party/WebKit/Source/core/Precompile-core.h': No such file or directory
```

需要patch两个文件blink/renderer/platform/BUILD.gn 和 blink/renderer/core/BUILD.gn

```
--- qtwebengine/src/3rdparty/chromium/third_party/blink/renderer/platform/BUILD.gn
+++ qtwebengine/src/3rdparty/chromium/third_party/blink/renderer/platform/BUILD.gn
@@ -204,7 +204,7 @@


config("blink_platform_pch") {
   if (enable_precompiled_headers) {
-    if (is_win) {
+    if (false) {
       # This is a string rather than a file GN knows about. It has to match
       # exactly what's in the /FI flag below, and what might appear in the
       # source code in quotes for an #include directive.
```