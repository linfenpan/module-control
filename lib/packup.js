/**
 * 编译成功后，需要打包
 * @author da宗熊
 * @email 384858402@qq.com
 */

var path = require("path");
	fsExtra = require("fs-extra"),
	minimatch = require("minimatch");

var $ = require("./tool");
var	access = require("./access");
var mcompiler = require("./mCompiler");

var packup = module.exports = {};

/**
 * 编译package信息，注意咯，被编译的目录，会被清空掉~
 * @param pkg {Object} 
 * @example: 
	{
		// 总体配置
		options: {
			js: ["combine"],
			css: ["copy", "renameURL"],
			less: ["combine", "renameURL"],
			other: ["copy"],
			dist: "./mmm",	// 编译后的目录，这个目录，会被清空掉..
			src: "./modules" // 需要编译的目录
		},
		// 需要打包的两种配置
		aaa: ["a():theme()", "b"],
		bbb: {
			// files字段是特殊的
			files: ["b", "c"],
			// 自己的配置信息，会覆盖掉默认的
			css: ["combine", "renmaeURL"]
		}
	}
 */
packup.compileAll = function compileAll(pkg){
	var res = {}, item;
	for(var i in pkg){
		if(i === "options"){continue;}
		
		// 新的编译器，不会相互影响
		// console.log(pkg);
		var compiler = mcompiler.proxy(pkg);

		item = pkg[i];
		if($.type(item) === "object"){
			item = item.files;
		}
		res[i] = compiler.compile(item);
	}
	// 编译后的数据，进行打包
	// res -> {aaa: [{list: [src1, src2], name: "moduleName"], bbb: [{}, {}]}
	this._packByOptions(res, pkg || {});
};

/**
 * 通过编译后的信息，进行打包
 * @param data {Object} 编译后的数据 -> {aaa: [{list: [src1, src2], name: "moduleName"], bbb: [{}, {}]}
 * @param pkg {Object} 包配置
 */
packup._packByOptions = function(data, pkg){
	var def = $.extend({
		js: ["combine"],
		css: ["combine", "renameURL"],
		other: ["copy"],
		dist: "./_module-control",
		src: "./modules/", // modules文件的目录
		imagePath: "image" // dist + imagePath
	}, pkg.options || {});
	
	// 清空目标目录
	fsExtra.emptyDirSync(def.dist);
	
	for(var i in data){
		var item = data[i], options = pkg[i] || {};
		var pkgName = i;
		
		if($.type(options) === "array"){
			options = {};
		}
		// 参数合并，清理不必要文件
		options = $.extend({}, def, options);
		delete options.files;

		// 遍历所有目录
		item.forEach(function(data, i){
			// data -> {name: "moduleName", list: [需合并的文件s]}
			this._packOneModule(pkgName, data.name, data.list, options);
		}.bind(this));

	}
}

/**
 * 对单独一个板块，进行打包
 * @param pkgName {String} 当前包名  -> aaa
 * @param name {String} 当前打包的模块名 -> a
 * @param list {Array} 当前要处理的文件列表
 * @param options {Object} 当前package的配置 -> {js:[], css:[], less:[],other:[],dist:,imagePath}
 */
packup._packOneModule = function(pkgName, name, list, options){
	var max = list.length;
	if(max > 0){
		var ops = $.extend({}, options || {});
		delete ops.dist;
		delete ops.imagePath;
		delete ops.src;
		delete ops.cwd;

		var opsList = [];
		for(var i in ops){
			if(i != "other"){
				opsList.push(i);
			}
		};
		// 对其他类型文件，进行拷贝
		// 拷贝时，如果是图片，会被强制指定放置目录，并且修正文件夹路径
		var otherList = list.filter(minimatch.filter("!*.{"+ opsList.join(",") +"}", {matchBase: true}));
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
}

// 文件操作
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
		$.log("复制:", list);

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
		
			access.copy(src, name);
			newList.push(name);
		}
		return newList;
	},
	combine: function(type, list, options, obj){
		$.log("合并:", list);

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
		$.log("修正链接:", list);

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
