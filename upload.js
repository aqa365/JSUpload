/* Upload beta-1.0.0 web上传插件 兼容IE8，IE9
 http://code.taobao.org/p/lib-common/src/common/upload.js  
 Date:2017-08-22 By 远方。 
 ---------------------------------

 var upload = new Upload( {
	el:selector , // 任意元素
	url:"",
	param:""
	done:function
	..
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
		eventChange = function( file ){

			this.files = getFiles( file );

			if( !this.validate() ) return false;

			this.request();

		},

		// 验证扩展名
		validateFileType = function( ext ){

			if( !this.params.fileType ) return true;

			var fileTypes = this.params.fileType.split( ',' );

			for( var i in fileTypes ){

				var item = fileTypes[ i ].split( '.' )[ 1 ].toLowerCase();

				if( item == '*' ) return true;

				if( item != ext.toLowerCase() ) return false;

			} 

			return true;

		},

		getFiles = function( e ){

			// ie 8 、9
			if (navigator.userAgent.indexOf("MSIE 8") >= 1 || navigator.userAgent.indexOf("MSIE 9") >= 1 ){

				try{

					var fso = new ActiveXObject("Scripting.FileSystemObject");

				}
				catch( ex ){

					console.log( 'ActiveXObject 创建失败 ! ' );

					return [ { name : e.value.split( '.' )[ e.value.split( '.' ).length - 1 ] , size : e.document.fileSize } ];

				}

				return [ fso.GetFile( e.value ) ];

			}else{

				return e.files;

			}
			

		},
		// 创建form
		createForm = function(){

			$( '[upload-form-' +  this.params.name + ']' ).remove();

			//accept="image/*"  （谷歌浏览器bug，导致选择文件加载过慢的问题） 必须以一下方式 
            //accept="image/gif,image/jpg,image/png" 
            var form = '<form method="post" style="display:none" upload-form-' + this.params.name + ' enctype="multipart/form-data" >';
            form += '<input type="file" accept="image/jpg,image/png,image/jpeg" upload-file-' + this.params.name + ' name="' + this.params.name + '" ' + ( this.params.single ? '' : 'multiple' ) + ' />';
            form += '</form>';

            var that = this;

            var $form = $( form ).appendTo( $( 'body' ) );

            $( '[type=file]' , $form ).bind( 'change' , function(){

            	eventChange.call( that , this );

            } ).click();



		},

		// h5 
		formDataRequest = function(){

			var that = this;

			var formData = new FormData();

	        $.each( this.files , function ( i ) {

	            formData.append( that.params.name , that.files[ i ] );

	        })

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

	            	if( that.params.done )
	                	that.params.done.call( that , data );
	                else
	                	console.log( data );

	            },
	            error: function ( errorData ) {

	            	console.log( errorData );

	            }
        	});

		},

		// ie
		submitRequest = function(){

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

				var data = $( this ).contents().find( 'body' ).text();

				console.log( data );

				//alert( data );

			} )

			if ( navigator.userAgent.indexOf("MSIE 8") >= 1 ){

				var that = this;

				// var $dialog = $( '<div style="ZOOM: 1; TOP: 150px; VISIBILITY: visible;top: 150px;left: 50%;margin-left: -300px;width: 520px;position: absolute;z-index: 10001;padding: 30px 40px 34px;-moz-border-radius: 5px;-webkit-border-radius: 5px;border-radius: 5px;-moz-box-shadow: 0 0 10px rgba(0, 0, 0, .4);-webkit-box-shadow: 0 0 10px rgba(0, 0, 0, .4);-box-shadow: 0 0 10px rgba(0, 0, 0, .4);background-color: #FFF;"></div>' ).appendTo( 'body' )
				// var $shade = $( '<div class="reveal-modal-bg" style="display: block; cursor: pointer;position: fixed;height: 100%;width: 100%;z-index: 10000;top: 0;left: 0;background: rgba(00, 00, 00, 0.8);filter:progid:DXImageTransform.Microsoft.gradient(startColorstr=#cc000000,endColorstr=#cc000000)"></div>' ).appendTo( 'body' );
				// var $dialogForm = $( '[upload-form-' + this.params.name + ']' ).appendTo( $dialog ).show();
			    // $( 'input' , $dialogForm ).css( { top : '-999px' , position : 'fixed' } );
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



	Upload.fn = Upload.prototype = {
		constructor:Upload,

		/*
			params:{
				// main
				el:selector //选择器，可以是任何的元素
				
				name : string // name属性 若为undefined 则以 el 的为准

				url:string // 服务器上传地址

				param:object // 上传参数
				
				onActionExecuting: fun //上传执行前 若结果为false则立即终止

				done:fun // 上传完成时
			
				// properties
				
				fileSize:int // 上传大小 以kb为单位
				fileCount:int // 单次上传数量
				

				fileType:string // 英文逗号分隔 。 所有类型：*.*  指定类型: *.jpg,*.png,*.jpeg,*.mp4

				single:boolean // 若为true每次只能上传一个文件
				singleUpload:boolean // 若为true 则一个一个的上传(一个文件一个请求)，否则，批量上传
			}
		*/
		init:function( params ){

			this.params = { 

				el : undefined , 

				name : params[ name ] || $( params.el ).attr( 'name' ) ,

				url : undefined ,

				param : undefined ,

				onActionExecuting : undefined , 

				done : undefined ,  

				fileSize : undefined ,

				fileCount : undefined ,

				fileType : '*.*' ,

				single : false , 

				singleUpload : false

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

			var that = this;

			$( this.params.el ).bind( 'click' , function(){

				createForm.call( that );

			} )

		},

		validate:function(){

			// 数量
			if( this.params.fileCount && this.files.length > this.params.fileCount ){

				alert( '你单次只能上传' + this.params.fileCount + '个文件' );

				return false;

			}

			for( var i = 0; i < this.files.length; i++ ){

				var item = this.files[ i ];

            	var fileType = item.name.substring( item.name.lastIndexOf( '.' ) + 1 );

            	// 扩展名
            	if( !validateFileType.call( this , fileType ) ){

            		alert( '文件类型错误，您只能上传：{ ' + this.params.fileType + ' }的文件' );

            		return false;

            	}       

            	// 文件大小
            	var fileSize = item.size / 1024; 

	            if ( this.params.fileSize && fileSize > this.params.fileSize ) {

	            	alert( '文件' + item.name + '的大小不可超过' + this.params.fileCount + 'KB' );

	            	return false;

	            }     		

			}

			return true;

		},

		// 获取本地预览地址
		// return [] || string
		getLocalPreviewUrl:function( index ){

			if ( index ) {
				// TODO

			}

			// TODO

		},

		request:function(){

			if( this.onActionExecuting )
				if( !this.onActionExecuting.call( this ) )
					return;

			if (navigator.userAgent.indexOf("MSIE 8") >= 1 || navigator.userAgent.indexOf("MSIE 9") >= 1 ){

				submitRequest.call( this );

			}else{

				formDataRequest.call( this );

			}


		}

	}

	Upload.fn.init.prototype = Upload.fn;

	return Upload;

} )