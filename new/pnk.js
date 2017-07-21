
PNK.pnkPath = "//localhost/gila/pnk?"


function PNK(el)
{
	this.el = document.getElementById(el)
	this.src = this.el.getAttribute('data-src')
	this.table = JSON.parse(this.el.getAttribute('data-table'))
	return this;
}
	
PNK.set = function(el,src,args)
{
	this.el = document.getElementById(el)
	this.el.setAttribute('data-src',src)
	this.el.setAttribute('data-table',JSON.stringify(args))
	this.src = src
	this.table = args
	if(typeof this.table.commands=='undefined') this.table.commands = []
	
	//this.update()
	return this;
}

PNK.thead = function()
{
	let txt='<tr>'
	for(i in this.table.fields) {
		field = this.table.fields[i]
		cv = i
		if(typeof field.title!='undefined') {
			cv = field.title
		}
		txt=txt+'<th>'+cv

	}
	return txt
}

PNK.tbody = function(data)
{
	let txt = ''
	let com = ''
	let id = (typeof this.table.id!='undefined')?data.fields.indexOf(this.table.id):0
	if(typeof this.table.commands!='undefined') com = PNK.commands_display(this.table.commands);
	
	for(r in data.rows) {
		row_id = data.rows[r][id]
		txt+='<tr data-id="'+row_id+'">'
		// Add columns
		for(i in this.table.fields) {
			field = this.table.fields[i]
			idx = data.fields.indexOf(i)
			cv = data.rows[r][idx]
			if(typeof field.display!='undefined') {
				cv = field.display(data.rows[r])
			}
			txt=txt+'<td>'+cv
		}
		// Add the commands
		txt += com
		
		
	}
	return txt
}

PNK.commands_display = function(commands)
{
	let txt = '<td>'
	for(com of commands) {
		command = PNK.commands[com]
		txt += '<button class="pnk-com" com="'+com+'"><i class="fa fa-'+command.fa+'"></i> '+command.title+'</button>'
	}
	return txt
}

PNK.load_more = function(index)
{
	let _tbody = this.el.getElementsByTagName('TBODY')[0]
	let _this = this
	$.getJSON(PNK.pnkPath+"t="+this.src+"&action=list&startIndex="+index,function(data){
		let index = parseInt(data.startIndex) + data.rows.length
		if(data.totalRows > index) {
			_this.load_more(index)
		}
		_tbody.innerHTML += _this.tbody(data)		
	})
}

PNK.update = function()
{
	_el = this.el	
	_table = this.table
	_this = this

	$.getJSON(PNK.pnkPath+"t="+this.src+"&action=list",function(data){
		console.log('')
		_el.innerHTML = "<table class='pnk-table'><thead></thead><tbody></tbody></table>";
		
		let txt='<table><thead>'
		txt+=_this.thead()

		txt+='</thead><tbody>'
		txt+=_this.tbody(data)

		txt+='</tbody></table>'
		_el.innerHTML = txt
		
		let index = parseInt(data.startIndex) + data.rows.length
		if(data.totalRows > index) {
			//_this.load_more(index)
		}
		
		/*if(typeof _table.selectable!='undefined') if(_table.selectable==true) $(_el).on('click','tbody tr',function(){
			this.classList.toggle('selected')
		})*/
		
	})
}


/*
	table = document.createElement("TABLE");
	tbody = document.createElement("TBODY");
	table.appendChild(tbody)
*/

$(document).on('click','.pnk-com',function(){
  var e = new Array();
  var command = $(this).attr("com");

  for(i in PNK.commands) if($(this).hasClass("com-"+i)) command=i;

  e.src = $(this).closest('table').attr('pnk-src');
  e.table_id = $(this).closest('table').attr('id');
  e.row = $(this).closest('tr');
  e.row_id = e.row.attr('data-id');
  e.tr = e.row;
  PNK('tbl')
  PNK.commands[command].fn(e);
});

PNK.commands = {
	select:{
		fa: "check", title: "", fn: function(el){ el.tr.toggleClass('selected'); }
	},
	edit:{
		fa: "pencil", title: "Edit", fn: function(el){ PNK.edit_dialog(el.table_id,"edit",el.row_id); }
	},
	clone:{
		fa: "copy", title: "Clone", fn: function(e){ PNK.edit_dialog(e.table_id,"clone",e.row_id); }
	},
	pdf:{
		fa: "file", title: "Pdf", fn: function(e){ window.open(pnkPath + "pdf.php?t="+e.src+"&id="+e.row_id); }
	},
	delete:{
		fa: "trash-o", title: "Delete", fn: function(e){
			if ( confirm(_e("Delete registry?"))) pnk_delete_row(e.tr);
		}
	},
}

PNK.commands.delete = {
	
}

/*************************************************************************************/
PNK._e = function (phrase)
{
	//if(typeof lang_array!=="undefined") if(typeof lang_array[phrase]!=="undefined") return lang_array[phrase];
	return phrase;
}

PNK.edit_dialog = function (tid,action,id="") {
	var t=$("#"+tid).closest('.pnk-table').attr('pnk-src');
	let editDiv = document.getElementById('edit-div')

	var row_id="";
	if(id=="") {
		dbupt=this._e('Save');
		dbt=this._e('New Registry');
	} else {
		dbupt=PNK._e('Update');
		dbt=PNK._e('Edit Registry');
		row_id=id;
	}
	if(action=="clone") {
		dbupt=PNK._e('Save');
		dbt=PNK._e('Clone Registry');
		row_id="";
	}
	
	btns='<div style="width: 100%;text-align:right;display: inline-block;margin-bottom:8px;border-top:1px solid #ccc"><br><br><button class="btn btn-primary pnk-edit-save" type="button" row-id="'+row_id+'" tid="'+tid+'">'+dbupt+'</button> <button class="btn btn-danger pnk-edit-cancel" type="button">'+this._e('Cancel')+'</button></div>';
	let _this = this
	
	// Add input for every field
	txt = '<div style="width: 100%;display: inline-block;margin-bottom:8px;border-bottom:1px solid #ccc">'
	txt += '<span class="pnk-edit-title">'+dbt+'</span></div><div id="pnk-edit-input-dialog"></div>'+btns
	editDiv.innerHTML = txt;
	editDiv.setAttribute('tid',tid);
	this.load_edit_form(id,"pnk-edit-input-dialog")

}

PNK.load_edit_form = function(id,el_id) {
	let el = document.getElementById(el_id)
	let _src = this.src
	$.ajax({
	url: this.pnkPath + "t="+this.src+"&action=edit", data: { 'id' : id }, dataType: "json",type: 'post',
		success: function(data) {
			el.innerHTML = PNK.edit_div(data)
			el.setAttribute('data-id',id);
			el.setAttribute('data-src',_src);
			if(typeof PNK.edit_dialog_fn=='function') PNK.edit_dialog_fn(sopt)
		}
	});
}

PNK.edit_div = function (data) {
	sopt = ''
	for(i=0; i<data.fields.length; i++) if(typeof this.table.fields[data.fields[i]]!='undefined'){
		field = this.table.fields[ data.fields[i] ];
		if(typeof field['edit']!='undefined') if(field['edit'] == false) continue;
		if(typeof field['title']!='undefined') title=field['title']; else title=data.fields[i];
		sopt=sopt+'<div class="update-div" col="'+data.fields[i]+'"><label for="'+data.fields[i]+'">'+title+'</label>'+PNK.createInput(field,data.rows[0][i])+'</div>';
	}
	return sopt
}

////  Method to return the field Input
PNK.createInput = function (df,v){
  arrv = new Array();
	// Select Dropdown
	if(df['options']) if(df['type']!="roles"){
		var sopt='';
		opn = 0;
		if(v=='') sopt='<option value="">-</option>';
    if(df['type']=='joins') arrv=v.split(","); else arrv[0]=v;

		for(var temp in df['options']){
			if(arrv.indexOf(temp)>-1) selected=' selected'; else selected='';
			sopt+='<option value="'+temp+'"'+selected+'>'+df['options'][temp]+'</option>';
			opn++;
		}

		if( opn >5 ) d_l_s = ' data-live-search="true"'; else d_l_s = '';

    if(df['type']=='joins') return '<select multiple class="pnk-input pnk-select" '+d_l_s+'>'+sopt+'</select>';
    return '<select class="pnk-input pnk-select" '+d_l_s+'>'+sopt+'</select>';
	}

  // Joins - Multiselect
  if(df['type']=='joins'){
    field_o = "<option value='1'>One</option><option value='2'>Two</option><option value='3'>three</option>";
    return '<select multiple>'+field_o+'</select>';
  }

	// Checkbox
	if(df['type']=="checkbox"){
		var checked='value="0"';
		if(v==1) checked='value="1" checked';
		return '<input type="checkbox" class="pnk-input" '+checked+'>';
	}

  // Textarea
	if(df['type']=='text') return '<textarea class="pnk-input">'+v+'</textarea>';
	// Date
	if(df['type']=='date') return '<input class="pnk-input datepicker" value="'+v+'">';
	// Datetime
	if(df['type']=='datetime') return '<input class="pnk-input datetimepicker" value="'+v+'">';

	// Normal Input
	var xclass="";
	return '<input type="text" class="pnk-input" value="'+v+'">';
}




/**********************************************************************/

PNK.edit_dialog_fn = function(txt)
{
	if(typeof $.fn.chosen != 'undefined') $(".pnk-select").chosen({disable_search_threshold: 10});
	//if(typeof $.fn.select2 != 'undefined') $(".pnk-select").select2();
	if(typeof($.fn.datetimepicker) == "function") {
		$(".datetimepicker").datetimepicker({format: 'Y-m-d H:i:s'});
		$(".datepicker").datetimepicker({format: 'Y-m-d'});
	}
}
