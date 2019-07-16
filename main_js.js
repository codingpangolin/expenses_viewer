if (typeof Object.assign != 'function') {
  Object.assign = function(target) {
    'use strict';
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }

    target = Object(target);
    for (var index = 1; index < arguments.length; index++) {
      var source = arguments[index];
      if (source != null) {
        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
    }
    return target;
  };
}

var months = [ "January", "February", "March", "April", "May", "June", 
           "July", "August", "September", "October", "November", "December" ];

function parseDate(dateStr) {
    var date = dateStr.split('/');
    var day = date[0];
    var month = date[1] - 1; //January = 0
    var year = date[2];
    return new Date(year, month, day); 
}

function pad(n){return n<10 ? '0'+n : n}

function date_to_string(date_obj){
	strmonth = pad(date_obj.getMonth()+1);
	strdaymonth = pad(date_obj.getDate());
	strfullyear = date_obj.getFullYear();
	final_date = strdaymonth + "/" + strmonth + "/" + strfullyear;
	return final_date;
}

function find_cats(){
	//returns an array listing categories in all data.
	allcats = []
	alldata_filtered = filter_data();
	for (index = 0; index < alldata_filtered.length; ++index) {
		if(allcats.indexOf(alldata_filtered[index][14]) <0){
			allcats.push(alldata_filtered[index][14]);
		}
	}
	if(allcats.length == 0){
		allcats.push("none found");
	}
	return allcats;
}

function checked_boxes(){
	var inputElements = $('.trans_check');

	var arr_checked_trans = []

	for(var i=0; i < inputElements.length; ++i){
		if(inputElements[i].checked){
			arr_checked_trans.push(inputElements[i].value);
		}
	}
	return arr_checked_trans;
}

function filter_data(){
	//filters json containing all data as required.
	//startd = parseDate(document.getElementById('startdate').value);
	startd = $("#startdate").datepicker('getDate');
	endd = $("#enddate").datepicker('getDate');
	
	var filtered_data = alldata.filter(function (item) {
	var itemTime = parseDate(item[2]);
	return itemTime >= startd && itemTime <= endd; 
	});
	
	check_list = checked_boxes();
	
	filtered_data = filtered_data.filter(function (dataRow) {
		return check_list.indexOf(dataRow[14]) > -1;
	});
	
	return filtered_data;
}

function month_string_arr(start_date,end_date){
	//generate array of months between two dates
	start_date=parseDate(start_date);
	end_date=parseDate(end_date);
	date_diff = end_date.getMonth() - start_date.getMonth() + (12 * (end_date.getFullYear() - start_date.getFullYear()));
	month_search_strings =[];
	for(nomo = 0; nomo<=date_diff; nomo++){
		monthno = start_date.getMonth() + 1;
		yearno = start_date.getFullYear();
		str_mandy = (monthno < 10 ? '0' : '') + monthno + "/"+yearno;
		month_search_strings.push(str_mandy);
		start_date.setMonth(start_date.getMonth() + 1);
	}
	return month_search_strings;
}

function monthly_cost(arr_months){
	//pass array of months to find spending totals for each.
	alldata_filtered = filter_data();
	arr_monthly_cost = [];
	arr_monthly_cost.push(["Month", "Total Spending (£)"]);
	for(mstring = 0; mstring<arr_months.length; mstring++){
		total_monthly_cost = 0;
		for(i = 0; i<alldata_filtered.length; i++){
			alldata_month = alldata_filtered[i][2].slice(-7);
			if(alldata_month == arr_months[mstring]){
				total_monthly_cost = currency(total_monthly_cost).add(currency(alldata_filtered[i][8]));
			}
		}
		month_str = months[parseInt(arr_months[mstring].slice(0,2))-1];
		year_str = arr_months[mstring].slice(-4);
		arr_monthly_cost.push([month_str + " " + year_str,parseFloat(total_monthly_cost)]);
	}
	return arr_monthly_cost;
}

function catspend_reformat_as_array(arr_dates,cats,catspend_obj){
	arr_formatted_gcharts = [];
	first_row = [];
	first_row.push('Date');
	for (catno = 0; catno < cats.length; ++catno){
		first_row.push(cats[catno]);
	}
	arr_formatted_gcharts.push(first_row);

	for (index = 0; index < arr_dates.length; ++index) {
		arr_row = [];
		datum = arr_dates[index];
		arr_row.push(datum);
		for (catno = 0; catno < cats.length; ++catno){
			catname = cats[catno];
			arr_row.push(catspend_obj[datum][catname]);
		}
		arr_formatted_gcharts.push(arr_row);
	}
	return arr_formatted_gcharts;
}

function catspendmonth_obj(all_categories, month_str_arr){
	var monthly_cat_obj = new Object();
	for (index = 0; index < month_str_arr.length; ++index) {
		var cat_spend = new Object();
		monthly_cat_obj[month_str_arr[index]] = cat_spend;
		for (catno = 0; catno<all_categories.length;++catno){
			monthly_cat_obj[month_str_arr[index]][all_categories[catno]] = 0;
		}	
	}
	for (catno = 0; catno<all_categories.length;++catno){
		catname = all_categories[catno];
		for(monthno = 0;monthno<month_str_arr.length;++monthno){
			datend = month_str_arr[monthno];
			overall_month_cost = 0;
			for (index = 0; index < alldata.length; ++index) {
				alldata_cat = alldata[index][14];
				alldata_transdate = alldata[index][2];
				alldata_cost = alldata[index][8];
				if(alldata_transdate.slice(-7) == datend && alldata_cat == catname){
					overall_month_cost = currency(overall_month_cost).add(currency(alldata_cost));
				}
			}
			monthly_cat_obj[month_str_arr[monthno]][catname] = parseFloat(overall_month_cost);
		}
	}
	return monthly_cat_obj;
}

function draw_bar(){
	monthly_cat_obj = catspendmonth_obj(find_cats(),month_string_arr(get_date("#startdate", "dd/mm/yy"),get_date("#enddate", "dd/mm/yy")));
	rawdata = catspend_reformat_as_array(month_string_arr(get_date("#startdate", "dd/mm/yy"),get_date("#enddate", "dd/mm/yy")),find_cats(),monthly_cat_obj);
	
	for(i=1; i < rawdata.length; ++i){
		rawdata[i][0] = months[parseInt(rawdata[i][0].slice(0,2))-1] + " " + rawdata[i][0].slice(-4);
	}

	var data = google.visualization.arrayToDataTable(rawdata);
	
	var options = {
		title: 'Monthly Spending ' + get_date("#startdate", "dd/mm/yy") + '-' + get_date("#enddate", "dd/mm/yy") ,
		chartArea: {width: "75%",
					height: "75%"},
					isStacked: true,
					focusTarget: 'category'};
	var chart = new google.visualization.ColumnChart($('#chartdisplay')[0]);

	var formatter = new google.visualization.NumberFormat({prefix: '£'});
    
	for(i=1; i<=find_cats().length; ++i){
		formatter.format(data, i);
	}
	
	chart.draw(data, options);
}
function all_dates_year(start_date, end_date){
	//function returns every date between two dates as array.
	//pass start and end date as strings.
	var daysOfYear = [];
	for (var d = parseDate(start_date); d <= parseDate(end_date); d.setDate(d.getDate() + 1)) {
		output_date = new Date(d);
		daysOfYear.push(date_to_string(output_date));
		}
	return daysOfYear;
}

function cumulative_cost(arr_dates){
	//pass array of dates from function all_dates_year
	//returns array of cumulative cost to every date in array.
	spend_to_date = [];
	spend_to_date.push(["date", "cost_cumulative"]);
	total_cost = 0;
	for(ind_date = 0; ind_date<arr_dates.length; ind_date++){
		date_to_agg = arr_dates[ind_date];
		for (index = 0; index < alldata.length; ++index) {
			transaction_date = alldata[index][2];
			transaction_cost = alldata[index][8];
			if (transaction_date == date_to_agg){
			total_cost = currency(total_cost).add(currency(transaction_cost));
			}
		}
		spend_to_date.push([date_to_agg,parseFloat(total_cost)]);
	}
	return spend_to_date;
}

function cat_spend_obj(date_array, cats){
	//generate object of object with all dates and spending to category (set to 0)
	var formatted_area_obj = new Object();
	for (index = 0; index < date_array.length; ++index) {
		cat_date = new Object();
		formatted_area_obj[date_array[index]] = cat_date;
		for(catno = 0; catno<cats.length;++catno){
			formatted_area_obj[date_array[index]][cats[catno]] = 0;
		}
	}
	//calculate daily cost per category.
	for (catno = 0; catno < cats.length; ++catno){
		catname = cats[catno];
		cat_cost = 0;
		for (index = 0; index < date_array.length; ++index) {
			datum = date_array[index];
			for (all_i = 0; all_i < alldata.length; ++all_i) {
				if(alldata[all_i][14]==catname && alldata[all_i][2]==datum){
					cat_cost = currency(cat_cost).add(currency(alldata[all_i][8]));
				}
			}
			formatted_area_obj[datum][catname] = parseFloat(cat_cost);
		}
	}
	return formatted_area_obj;
}

function drawArea(){
	spend_obj = cat_spend_obj(all_dates_year(get_date("#startdate", "dd/mm/yy"),get_date("#enddate", "dd/mm/yy")),find_cats());
	rawdata = catspend_reformat_as_array(all_dates_year(get_date("#startdate", "dd/mm/yy"),get_date("#enddate", "dd/mm/yy")),find_cats(),spend_obj);
	
	var data = google.visualization.arrayToDataTable(rawdata);
	var options = {
		title: 'Total Spending ' + get_date("#startdate", "dd/mm/yy") + '-' + get_date("#enddate", "dd/mm/yy"),
		isStacked: true,
		focusTarget: 'category'};
	
	var chart = new google.visualization.AreaChart($('#chartdisplay')[0]);
	
	var formatter = new google.visualization.NumberFormat({prefix: '£'});
    
	for(i=1; i<=find_cats().length; ++i){
		formatter.format(data, i);
	}
	
	chart.draw(data, options);
}
//code below is for piebar section of app
//pie chart data
function calc_trans_cost(group_col){
	//pass function value of either person or transportation
	var cost_transport_dict = new Object();
	
	var groupedloc = {person:12, transportation:13};
	filter_alldata = data_filtered_selectbox();

	for (index = 0; index < filter_alldata.length; ++index) {
		var data_col = filter_alldata[index][groupedloc[group_col]];
		var cost = parseFloat(filter_alldata[index][8]);
		
		if (cost_transport_dict.hasOwnProperty(data_col)==false){
			cost_transport_dict[data_col] = cost;
		}else{
			var current_cost = cost_transport_dict[data_col];
			var new_cost = currency(cost).add(currency(current_cost));
			cost_transport_dict[data_col] = parseFloat(new_cost);
		}
	}
	
	return cost_transport_dict;
}
//bar chart data
function calc_trans_person_cost(outergroup, innergroup){
	//pass transportation or person to args in order as desired
	filter_alldata = data_filtered_selectbox();
	var trans_type_dict = new Object();
	var groupedloc = {person:12, transportation:13};
	var groupby_key = groupedloc[outergroup];
	var inner_group = groupedloc[innergroup];

	for (index = 0; index < filter_alldata.length; ++index) {
		var grouped_cat = filter_alldata[index][groupby_key];
		if(trans_type_dict.hasOwnProperty(grouped_cat)==false){
			var costs = new Object();
			trans_type_dict[grouped_cat] = costs;
		}
	}

	for (index = 0; index < filter_alldata.length; ++index) {
		var aggd_data = filter_alldata[index][inner_group];
		var grouping = filter_alldata[index][groupby_key];
		var cost = parseFloat(filter_alldata[index][8]);
		
		if(trans_type_dict[grouping].hasOwnProperty(aggd_data)==false){
			trans_type_dict[grouping][aggd_data] =cost;
		}else{
			var current_cost = trans_type_dict[grouping][aggd_data];
			var new_cost = currency(cost).add(currency(current_cost));
			trans_type_dict[grouping][aggd_data] = parseFloat(new_cost);
		}
	}
	return trans_type_dict;
}

//create array of transportation cost data formatted for google charts api
function trans_array(expense_to_transport, header1, header2){

	travel_expense = [];

	for(var i in expense_to_transport){
		travel_expense.push([i, expense_to_transport[i]]);
	}

	travel_expense.sort(function(a,b){return a[1] - b[1];});

	travel_expense.reverse();
	
	travel_expense.unshift([header1,header2]);
	
	return travel_expense;

}

function drawPie(piearray, bararray){
	google.charts.load('current', {'packages':['corechart']});
	var data = google.visualization.arrayToDataTable(piearray);
	endtitle = "by Category";
	title_prefix = $('#selectcategory')[0].value;
	
	if($('#personconfig')[0].checked){endtitle = "by Employee"};
	var options = {'title': title_prefix + ' Expenditure ' + endtitle,
				'backgroundColor': 'transparent',
				'chartArea': {'width': '100%', 'height': '80%'}};

	var chart = new google.visualization.PieChart($('#piechart')[0]);

	function selectHandler() {
		var selectedItem = chart.getSelection()[0];
		if (selectedItem) {
			var transport_selected = data.getValue(selectedItem.row, 0);
			drawBar(trans_array(bararray[transport_selected], "person", "cost"),transport_selected);
		}
	}

	google.visualization.events.addListener(chart, 'select', selectHandler); 

	var formatter = new google.visualization.NumberFormat({prefix: '£'});
	formatter.format(data, 1);
	chart.draw(data, options);
	if(piearray.length != 1){
		chart.setSelection([{row:0}]);
		drawBar(trans_array(bararray[piearray[1][0]], "person", "cost"), piearray[1][0]);
	}else{
		$('#barchart').html('');
	}
}

function drawBar(chartarray, trans_input){

	var data = google.visualization.arrayToDataTable(chartarray);
	
	if($('#personconfig')[0].checked){
		title_str = trans_input + " " + $('#selectcategory')[0].value + " Costs";
	}else{
		title_str = trans_input + " Costs per Person";
	};

	var options = {'title': title_str,
				    'backgroundColor': 'transparent',
					hAxis: {title: 'Expenditure (£)', minValue: 0}, 'chartArea': {'height': '80%'}};
	
	google.charts.load('current', {'packages':['corechart', 'bar']});
	
	var chart = new google.visualization.BarChart($('#barchart')[0]);
	
	var formatter = new google.visualization.NumberFormat({prefix: '£'});
    formatter.format(data, 1);

	chart.draw(data, options);
}

function test_radio_piebar(){
	if(document.getElementById("personconfig").checked){
		draw_piebar_byperson();
	}else{
		draw_piebar_bycat();
	}
}

function populate_select(){
	selectbox = $('#selectcategory')[0];
	if(selectbox.options.length > 0){
		for(i=0;i<selectbox.options.length;++i){
			selectbox.remove(i);
		}
	}
	cats = find_cats();
	for(i=0;i<cats.length;++i){
		selectbox.options[i] = new Option(cats[i], cats[i]);
	}
}

function data_filtered_selectbox(){
	selectbox = $('#selectcategory')[0];
	selectbox.value;
	alldata_filtered = filter_data();
	var filtered_data = alldata_filtered.filter(function (item) {
	var itemCat = item[14];
	return itemCat==selectbox.value; 
	});
	return filtered_data;
}

function button_click_actions(){
	populate_select();
	test_radio_load_graphs();
	test_radio_piebar();
}

function checkbox_clicked(){
	button_click_actions();
}

$('.trans_check').on('click', checkbox_clicked);


$("#gobutton").click(function(){
	validation_test = date_validation();
	if(validation_test){
		button_click_actions();
	}
});

$("#monthlyconfig").click(function(){
	draw_bar();
});

$("#totalconfig").click(function(){
	drawArea();
});

$("#personconfig").click(function() {
	draw_piebar_byperson();
});

$("#catconfig").click(function() {
	draw_piebar_bycat();
});

$("#selectcategory")[0].onchange = function(event) {
	test_radio_piebar();
}

function test_radio_load_graphs(){
	if($("#monthlyconfig")[0].checked){
		draw_bar();
	}else{
		drawArea();
	}
}

function draw_piebar_bycat(){
	var piedata = trans_array(calc_trans_cost('transportation'),"transport","expense");
	var bardata = calc_trans_person_cost("transportation", "person");

	drawPie(piedata, bardata);
}

function draw_piebar_byperson(){
	var piedata = trans_array(calc_trans_cost('person'),"transport","expense");
	var bardata = calc_trans_person_cost("person", "transportation");

	drawPie(piedata, bardata);
}

function date_validation(){
	if(get_date("#startdate", "@") > get_date("#enddate", "@")){
		alert("Start date cannot be later than end date.");
	}else{
		return true;
	}
}

function display_arb_dates(){
	$('#startdate').val("01/01/2018");
	$('#enddate').val("31/12/2018");
	button_click_actions();
}

$( function() {
	$(".dateinput").datepicker({
		dateFormat: "dd/mm/yy",
		minDate: new Date(2018,0,1),
		maxDate: new Date(2018,11,31)
	});
});

function get_date(date_elem, format_sel){
	//for string "dd/mm/yy"
	//for unix epoch @
	return $.datepicker.formatDate(format_sel, $(date_elem).datepicker('getDate'));
}

window.addEventListener("load", function(){
    $('#monthlyconfig').attr('checked', 'checked');
	google.charts.load('current', {
	  callback: function() {display_arb_dates();
							populate_select();
							$("#personconfig").click();},
	  packages: ['corechart', 'table']
	});
});