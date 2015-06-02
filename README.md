# 模块控制管理--v.1.0.0 beta版

#### 开发初衷:

 * 管理文件夹的各个板块
 * 各个板块，可以划分为各个不同版本
 * 各个板块，可以自己管理自己的最新版本，默认主题
 * 可以通过快捷的配置，读取文件板块，进行合并、拷贝、重写url等操作
 * 可以通过简单的表达式，进行模块合并，如: "moduleA": ["a:theme(1.0.0)", "b"]

#### 当前版本已实现功能：

 * 表达式解析，如 "a:theme(1.0.0)"，能解析为读取 模块a，以及它下面的 theme/1.0.0 文件夹
 * 文件合并、拷贝，重写url还不完善
 * 支持后缀配置的方式，制定相关文件的操作，现有3个操作：copy, combine, renameURL

#### 当前未完成功能：

 * 没有发布到npm
 * 没有读取外部配置文件
 * 还限于测试阶段，不能保证其稳定性



#### 代码展示:

```javascript
var packup = require("./lib/packup");
var pkg = {
	options: {
		js: ["combine"],	// 对脚本进行合并操作
		css: ["copy", "renameURL"],	// 对样式进行复制操作，并重写url()部分
		other: ["copy"],	// 非js/css文件，进行拷贝
		dist: "./mmm",	// 构建后的文件，放于 mmm 目录【此目录会被清空】
		src: "./modules/"	// 当前板块，放于 modules 目录
	},
	aaa: ["a():theme()", "b"],	// 板块aaa，包含module a 和 b
	bbb: {
		files: ["b", "c"],		// 不同的配置方式，类似上面 aaa
		css: ["combine", "renmaeURL"]	// 可重写options的配置，不同板块可拥有自己的配置
	}
};
// 编译，进行文件打包
packup.compileAll(pkg);
```


#### 正式版本展望:

 * 把package配置，改为各项目管理自己的
 * 支持cmd命令
 * 开放插件注入功能 


#### 最后的最后:

这次的开发，纯属个人项目，与公司、团队无关，可喷可指导。

第一次做node的前端管理项目，不知道最后能用上不。

有指导的，可联系 1071093121@qq.com 或 csdn [@da宗熊](http://blog.csdn.net/linfenpan)

