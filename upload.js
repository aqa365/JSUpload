/* Upload 1.0.0 web上传插件 兼容IE8，IE9
https://github.com/aqa365/JSUpload
 Date:2017-08-22 By 远方。 
 ---------------------------------

 除el属性外，其余元素均可动态调配
 upload.params.除el外的任意属性

 var upload = new Upload( {
	el:selector , // 任意元素
	url:"",       // 服务器上传地址
	param:"" ,    // 上传参数
	done:function // 上传完成时

	.. 选填
				
	name : string // name属性 若为undefined 则以 el 的为准				
	onActionExecuting: fun //上传执行前 若结果为false则立即终止
		
	fileSize:int // 上传大小 以kb为单位
	fileCount:int // 单次上传数量				
	fileType:string // 英文逗号分隔 。 所有类型：*.*  指定类型: *.jpg,*.png,*.jpeg,*.mp4

	single:boolean // 若为true每次只能上传一个文件
	singleUpload:boolean // 若为true 则一个一个的上传(一个文件一个请求)，否则，批量上传

	zip:undefined // 在指定图片格式为 image/jpeg 或 image/webp的情况下，可以从 0 到 1 的区间内选择图片的质量（压缩）
	zipFilterSize:kb // 文件超过多少kb时开启压缩 

	disable:false // 是否禁用

 } )

 */
( function( window , fun ){

	if ( typeof define === "function" && define.amd ) {

		define( [ 'jquery' ], function ( jQuery ) {  return fun( jQuery ); } );

	}else{

		 window.Upload = fun( window.jQuery );

	}

} )( window , function( jQuery , undefined ){

	var

		Upload = function( params ){

			return this.init( params );

		},
		// 获取 input file 的文件
		getFiles = function( e ){

			// ie 8 、9
			if (navigator.userAgent.indexOf("MSIE 8") >= 1 || navigator.userAgent.indexOf("MSIE 9") >= 1 ){

				try{

					var fso = new ActiveXObject( "Scripting.FileSystemObject" );

				}
				catch( ex ){

					console.log( 'ActiveXObject 创建失败 ! ' );

					return [ { name : e.value.split( '.' )[ e.value.split( '.' ).length - 1 ] , size : e.document.fileSize } ];

				}

				return [ fso.GetFile( e.value ) ];

			}else{

				return e.files;

			}
			

		}
		


	Upload.fn = Upload.prototype = {
		constructor:Upload,

		init:function( params ){

			this.params = { 

				el : undefined , 

				name : params[ name ] || $( params.el ).attr( 'name' ) || 'upload' ,

				url : undefined ,

				param : undefined ,


				onActionExecuting : undefined , 

				done : undefined ,  


				fileSize : undefined ,

				fileCount : undefined ,

				fileType : '*.*' ,


				single : false , 

				singleUpload : true,


				zip : undefined,

				zipFilterSize : 0,

				disable : false


			};

			if( !params )
				return this;

			if( !params[ 'el' ] )
				throw new Error( 'element is not defined.' );

			if( !params[ 'url' ] )
				throw new Error( 'service url is not defined.' );

			for( var key in params ){

				this.params[ key ] = params[ key ];

			}

			this.createCanvas();

			var that = this;

			$( this.params.el ).bind( 'click' , function(){

				if( that.params.disable ) return;

				that.createForm();

			} )

		},	
		request:function(){
			if( this.params.onActionExecuting )
				if( !this.params.onActionExecuting.call( this ) )
					return;

			if ( this.isIE( 8 ) || this.isIE( 9 ) ){

				this.submitRequest( this );

			}else{

				var that = this;
							
				if( !this.params.singleUpload ){
					var formData = new FormData();
					this.eachFile( function(){
						formData.append( that.params.name , this );
					} );
					
					this.formDataRequest( formData );
					return;
				}

				// one request , one file
				this.eachFile( function(){
					if( that.isZip( this.size / 1024 ) ){				
						var localPreviewUrl = that.getLocalPreviewUrl( this );
						that.zipImg( localPreviewUrl );
						return;
					}
					var formData = new FormData();
					formData.append( that.params.name , this );
					that.formDataRequest( formData );

				} )
			
			}

		},
		formDataRequest : function( formData ){
			var that = this;
			$.ajax({
				url: this.params.url,
				type: 'POST',
				data: formData,
				async: true,
				cache: false,
				contentType: false,
				processData: false,
				dataType: "json",
				success: function ( data ) {
					that.length -= 1 ;
					if( that.params.done )
						that.params.done.call( that , data );
					else
						console.log( data );
				},
				error: function ( errorData ) {
					that.length -= 1 ;
					console.log( errorData );
				}
			});

		},
		submitRequest : function(){
			
			var that = this;

			$( '[name=upload-iframe-' + this.params.name + ']' ).remove();

			$( '[name=upload-form-submit-' + this.params.name + ']' ).remove();

			// iframe
			var $iframe = $( '<iframe style="position:absolute;top:-9999px"></iframe>' )
							.attr( 'name' , 'upload-iframe-' + this.params.name )
							.appendTo( 'body' );

			// form
			var $form = $( '[upload-form-' + this.params.name + ']' )
							.attr( { 'target' : 'upload-iframe-' + this.params.name , 'action' : this.params.url } );

			// result
			$iframe.bind( 'load' , function(){
				
				that.length -= 1 ;

				var data = $( this ).contents().find( 'body' ).text();

				if( that.params.done )
					that.params.done.call( that , eval( '(' + data + ')' ) );
				else
					console.log( data );
			} )

			if ( navigator.userAgent.indexOf("MSIE 8") >= 1 ){

				var that = this;

				$form.append( '<input type="submit" value="立即上传" >' );
				
				$( '[type=submit]' , $form ).bind( 'click' , function(){

					// 必须加上此事件
					$( '[upload-form-' + that.params.name + ']' ).submit();

					return true;

				} )

			}

			// submit
			$form.submit();

			// 如果是ie8 则再一次触发 sumit 的click事件
			if ( navigator.userAgent.indexOf("MSIE 8") >= 1 ){

				$( '[type=submit]' , $form ).click();

			}
			
		}

	}

	Upload.fn.extend = function(){
		
		if( typeof arguments[ 0 ] === 'object' ){

			for (var key in arguments[ 0 ]) {
				
				Upload.fn[ key ] = arguments[ 0 ][ key ];

			}

		}
	}

	Upload.fn.extend( {

		createForm : function(){

			$( '[upload-form-' +  this.params.name + ']' ).remove();
			
			//accept="image/*"  （谷歌浏览器bug，导致选择文件加载过慢的问题） 必须以一下方式 
			//accept="image/gif,image/jpg,image/png" 
			var form = '<form method="post" style="display:none" upload-form-' + this.params.name + ' enctype="multipart/form-data" >';
			form += '<input type="file" accept="image/jpg,image/png,image/jpeg" upload-file-' + this.params.name + ' name="' + this.params.name + '" ' + ( this.params.single ? '' : 'multiple' ) + ' />';
			form += '</form>';

			var that = this;
			var $form = $( form ).appendTo( $( 'body' ) );
			$( '[type=file]' , $form ).bind( 'change' , function(){ that.change( this ); } ).click();

		},
		createCanvas : function(){

			if( !this.isZip() ) return;

			var canvas = $( '#canvas_zip' );
			if( canvas.length <= 0 ){
				$( '<div><canvas id="canvas_zip" style="margin: 0 auto; display: none; max-width: 656px; max-height: 310px;z-index:87" ></canvas></div>' ).appendTo( $( 'body' ) );
				canvas =  $( '#canvas_zip' );
			}

			this.canvas = canvas.get(0);
			this.canvas_context = this.canvas.getContext("2d");

		},
		change : function( e ){
			this.files = getFiles( e );	
			this.length = this.files.length;		
			if( !this.validate() ) return false;
			this.request();
		},
		validate : function(){

			if( !this.validateFileCount() ) return false;

			else if( !this.validateFileSize() ) return false;

			else if( !this.validateFileType() ) return false;

			return true;

		},
		validateFileCount : function(){
			if( this.params.fileCount && this.files.length > this.params.fileCount ){
				alert( '你单次只能上传' + this.params.fileCount + '个文件' );
				return false;
			}
			return true;
		},
		validateFileSize : function(){

			// 启用压缩后，若sizeKb 为 undefined 则跳过第一次无压缩验证
			// if( this.isZip() && !size_kb ) return true;

			// else if( size_kb  ){
			// 	return size_kb > this.params.fileSize;
			// }

			var result = true;
			var that = this;

			this.eachFile( function( item ){
				var fileSize = item.size / 1024; 		
				if ( that.params.fileSize && fileSize > that.params.fileSize ) {
					alert( '文件：' + item.name + '的大小不可超过' + that.params.fileSize / 1024 + 'M' );
					return result = false;
				}     		
			} );

			return result;

		},
		validateFileType : function(){

			var result = true;
			var that = this;
			
			this.eachFile( function( file ){

				if( !that.params.fileType ) return true;			
				var fileTypes = that.params.fileType.split( ',' );
	
				for( var i in fileTypes ){
					var item = fileTypes[ i ].split( '.' )[ 1 ].toLowerCase();
					if( item == '*' ) return true;
					if( item == file.name.substring( file.name.lastIndexOf( '.' ) + 1 ).toLowerCase() ) return true;
				} 
				alert( '文件类型错误，您只能上传：{ ' + that.params.fileType + ' }的文件' );
				return result = false;

			} )

			return result;

		},
		eachFile : function( callback ){
			$.each( this.files , function(){ callback.call( this , this ) } );
		},
		getLocalPreviewUrl : function( file ){
			
			var url = window.URL.createObjectURL( file );;
			if( !url )	url = file.value;			
			return url;

		},
		toBlob : function( dataurl ){
			var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
			bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
			while (n--) {
				u8arr[n] = bstr.charCodeAt(n);
			}
		 	return new Blob([u8arr], { type: mime });
		},
		zipImg : function( localPreviewUrl ){
			var canvasId = "#canvas_zip";
			var that = this;

			var img = new Image();
			img.src = localPreviewUrl;
			img.onload = function(){
				$( canvasId ).attr( "width" , img.width );
				$( canvasId ).attr( "height" , img.height );

				that.canvas_context.drawImage(img, 0, 0);
				var dataurl = that.canvas.toDataURL( "image/jpeg" , that.params.zip );

				var blob = that.toBlob( dataurl );
				// console.log( blob.size/1024 );
				// if( that.validateFileSize( blob.size ) ){ // 是否压缩到了指定的范围内 ， 如果超出则文件太大	
				// 	alert( '文件' + item.name + '的大小不可超过' + that.params.fileCount + 'KB' );
				// 	return;
				// }

				var formData = new FormData();
				formData.append( that.params.name , blob , "canvas.jpeg" );
				that.formDataRequest( formData );

			}
		},
		isIE : function( version ){
			var indexOf = navigator.userAgent.indexOf( "MSIE" + ( version ? " " + version : "" ) );
			return indexOf >= 1;
		},
		isZip : function ( file_size_kb ){
			var result = this.params[ 'zip' ] && ( !this.isIE(8) ) && ( !this.isIE(9) );
			if( file_size_kb )
				return result && file_size_kb > this.params.zipFilterSize;

			return result;
		}

	} )


	return Upload;

} )