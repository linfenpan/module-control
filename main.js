// 公共模块管理，到底要做什么功能呢？
// 基本:
// 1、根据模块名，合并脚本				[OK]
// 2、根据模块名，合并样式，拉取资源	[OK]

// 延伸：
// 1、脚本之间的依赖关系，如何定义？
// 2、样式之间，如何定义依赖呢？


// var path = require("path"), fs = require("fs");

var packup = require("./lib/packup");
// 包配置
var pkg = {
	options: {
		js: ["combine"],
		css: ["copy", "renameURL"],
		less: ["combine", "renameURL"],
		other: ["copy"],
		dist: "./mmm",
		src: "./modules/"
	},
	aaa: ["a():theme()", "b"],
	bbb: {
		files: ["b", "c"],
		css: ["combine", "renmaeURL"]
	}
};

var res = packup.compileAll(pkg);

console.log(res);


return;


