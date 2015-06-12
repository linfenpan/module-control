// 公共模块管理，到底要做什么功能呢？
// 基本:
// 1、根据模块名，合并脚本				[OK]
// 2、根据模块名，合并样式，拉取资源	[OK]

// 延伸：
// 1、脚本之间的依赖关系，如何定义？	[OK]
// 2、样式之间，如何定义依赖呢？		[OK]


// var path = require("path"), fs = require("fs");

var packup = require("./lib/packup"),
	$ = require("./lib/tool");

// node.js默认处理当前运行环境中的文件夹
// 就是说，命令窗口在哪里打开，上下文就在哪...
// 当然，除了require，require是根据当前脚本路径决定的...
var currentFilePath = process.cwd(),
	currentJSPath = __dirname;

// 打包文件
function gotoPackUp(pkgPath){
	var pkg = $.readFile2JSON(pkgPath || "./module-control.json");
	if(!pkg){
		console.log("请设置配置文件: module-control.json");
		return; 
	}
	
	var res = packup.compileAll(pkg);
	console.log("****************************\n0 很高兴为你服务，有空要常来哦~ 0\n****************************");
};
/*
process.title = "DouDou Game compiler";

// process.cwd() 当前node运行的目录
console.log('***        process.cwd() = ' + process.cwd() + ' ***');
// module.filename == __filename，是当前运行的文件
console.log('***      module.filename = ' + module.filename + ' ***');
console.log('***           __filename = ' + __filename + ' ***');
// 该行代码运行的目录
console.log('***            __dirname = ' + __dirname + ' ***');
// node.js启动的文件
console.log('*** require.main.filename= ' + require.main.filename + ' ***');

var path = require("path");
// node启动的所有参数，[node, 当前启动的文字, 额外的参数...]
// console.log(process.argv);
console.log(path.join(process.cwd(), "c:\\test\\a"));

return;
*/
var argv = process.argv.slice(2), param = {};
// 参数处理
;(function(list, param){
	if(list.length <= 1 && list[0] != "-h"){
		param["p"] = list[0];
	}else{
		// 对当前所有值进行遍历， "-"开头的配置，后面跟着，非"-"的是参数
		var item, key;
		for(var i = 0, max = list.length; i < max; i++){
			var item = list[i];
			if(item.indexOf("-") == 0){
				key = item.slice(1);
				param[key] = true;
			}else if(key){
				param[key] = item;
			}
		}
	}
})(argv, param);

// 处理参数
;(function(param){
	
	if(param.h){
		console.log("****************** 帮助 ******************");
		console.log("**** -h                打开命令帮助");
		console.log("**** -p xx.json        设置包配置路径");
		console.log("\n****************** module-control 1.0.0 beta版 ******************");
	}else if(param.p){
		gotoPackUp(param.p);
	}else{
		gotoPackUp();
	}
	
})(param);


