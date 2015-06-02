// 公共模块管理，到底要做什么功能呢？
// 基本:
// 1、根据模块名，合并脚本				[OK]
// 2、根据模块名，合并样式，拉取资源	[OK]

// 延伸：
// 1、脚本之间的依赖关系，如何定义？
// 2、样式之间，如何定义依赖呢？


// var path = require("path"), fs = require("fs");
var minimatch = require("minimatch");
var path = require("path");
var findAll = require("./lib/findAll");
var $ = require("./lib/tool");

var mod = require("./lib/modules"),
	access = require("./lib/access");

var mcompiler = require("./lib/mCompiler");

// 包配置
var pkg = {
	options: {
		js: ["combine"],
		css: ["copy", "renameURL"],
		less: ["combine", "renameURL"],
		other: ["copy"],
		dist: "./mmm"
	},
	aaa: ["a():theme()", "b"],
	bbb: {
		files: ["b():theme()", "c"],
		css: ["combine", "renmaeURL"]
	}
};

// 编译package
function compileAll(pkg){
	var res = {}, item;
	for(var i in pkg){
		if(i === "options"){continue;}
		
		// 新的编译器，不会相互影响
		var compiler = mcompiler.proxy();

		item = pkg[i];
		if($.type(item) === "object"){
			item = item.files;
		}
		res[i] = compiler.compile(item);
	}
	return res;
}
var res = compileAll(pkg);
// {aaa: [{list: [], name}], bbb: [{list: [], name:}]}
// for(var i in res){
// 	console.log(res[i]);
// }
// return;
// return;

var fsExtra = require("fs-extra");
// 通过配置，打包文件
function packByOptions(data, pkg){
	var def = $.extend({
		js: ["combine"],
		css: ["combine", "renameURL"],
		other: ["copy"],
		dist: "./_module-control",
		imagePath: "image" // dist + imagePath
	}, pkg.options || {});
	
	// 清空目标目录
	fsExtra.emptyDirSync(def.dist);
	// return;
	
	for(var i in data){
		var item = data[i], options = pkg[i] || {};
		var pkgName = i;
		
		if($.type(options) === "array"){
			options = {};
		}
		// 参数合并，清楚不必要文件
		options = $.extend({}, def, options);
		delete options.files;
		console.log(item);
		// 遍历所有目录
		item.forEach(function(data, i){
			packOneModule(pkgName, data.name, data.list, options);
		});

	}
	
};


// 打包一个板块
function packOneModule(pkgName, name, list, options){
	
	var max = list.length;
	if(max > 0){
		var ops = $.extend({}, options || {});
		delete ops.dist;
		delete ops.imagePath;
		var opsList = [];
		for(var i in ops){
			if(i != "other"){
				opsList.push(i);
			}
		};
		// 对其他类型文件，进行拷贝
		var otherList = list.filter(minimatch.filter("!*.{"+ opsList.join(",") +"}", {matchBase: true}));
		// 对其它文件进行修正
		// 必须在顶部
		if(otherList.length > 0){
			filesOperation.explain({
				operation: "other",
				list: otherList,
				options: options,
				moduleName: name,
				pkgName: pkgName
			});
		}

		// 把所有操作，遍历一次
		for(var i = 0, max = opsList.length; i < max; i++){
			var _type = opsList[i];
			var _list = list.filter(minimatch.filter("*." + _type, {matchBase: true}));
			// 对js进行修正
			if(_list.length > 0){
				filesOperation.explain({
					operation: _type,
					list: _list,
					options: options,
					moduleName: name,
					pkgName: pkgName
				});
			}
		}	
		
	}
};

var filesOperation = {
	// 解析
	/*
		operation: "css", // 操作类型
		list: cssList,	// 操作列表
		options: options,	// 参数
		moduleName: name,	// 板块名
		pkgName: pkgName	// package名
	*/
	explain: function(obj){
		var options = obj.options, list = obj.list, moduleName = obj.moduleName, pkgName = obj.pkgName;
		var type = obj.operation;
		
		var ops = options[type];
		
		$.type(ops) !== "array" && (ops = [ops]);
		var resList = list.slice(0);

		for(var i = 0, max = ops.length; i < max; i++){
			var fn = ops[i];
			if(this[fn]){
				// 有那个操作，就干活了~
				resList = this[fn](type, resList, options, obj);
			}
		}
	},
	copy: function(type, list, options, obj){
		var newList = [], name, src;
		for(var i = 0, max = list.length; i < max; i++){
			src = list[i];
			
			// 如果是图片、则放置在图片目录下
			// 否则，就拷到浅层目录下
			if($.isImage(src)){
				name = this._distName(src, this._imagePath(options), obj.moduleName);
			}else{
				name = this._distName(src, options.dist);
			}

			console.log(name);
		
			access.copy(src, name);
			newList.push(name);
		}
		return newList;
	},
	combine: function(type, list, options, obj){
		var newList = [];
		if(type != "other"){
			// 如果文件已经存在，则继续写入..
			// console.log("................", list);
			var name = path.join(options.dist, obj.pkgName + "." + type);
			if($.isExist(name)){
				access.append(name, list, options);
			}else{
				access.combine(name, list, options);
			}
			newList.push(name);
		};

		return newList;
	},
	renameURL: function(type, list, options, obj){
		// 两种图片引用嘛..
		// url(图)
		// <img src="图" />
		var imagePath = path.join(options.imagePath, obj.moduleName + "_");
		for(var i = 0, max = list.length; i < max; i++){
			var content = access.read(list[i]);
			content = content.replace(/url\('?(.*)'?\)/gmi, function(str, src){
				return "url("+ imagePath + path.basename(src) +")";
			}).replace(/src[^'"](?:"|')([^'"])+(?:"|')/gmi, function(str){
				return 'src="'+ imagePath + path.basename(src) +'"';
			});
			access.write(list[i], content);
		}
		return list;
	},
	// 目标文件 src源文件, dist目标目录, moduleName板块名
	_distName: function(src, dist, moduleName){
		var name = path.basename(src);
		name = path.join(dist, moduleName ? moduleName + "_" + name : name);
		return name;
	},
	// 图片目标路径
	_imagePath: function(options){
		return path.join(options.dist, options.imagePath);
	}
};


res = packByOptions(res, pkg);

console.log(res);


return;




var pack = {
	/**
	 * 打包
	 */
	pack: function(data, options){
		
	}
};

pack.pack(res, {
	options: {
		
	},
	aaa: {
		
	}
});

console.log(res);

// console.log(mod.js(["a", "b"]));

// var access = require("./lib/access");
// var jsList = mod.image(["a:theme(red):", "b"]);
// console.log(jsList);
// access.combine("./test/core.js", jsList);

// var list = fs.readdirSync("./modules");

// console.log(fs.existsSync('./modules/bbb/cc.txt'));

// 存储器
// 
// access.combine("./test/core.js", ["main.js", "package.json"]);