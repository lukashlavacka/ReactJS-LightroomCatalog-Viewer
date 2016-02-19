window.Utilities = {
	getFilterExpression(type, filter){
		var property;
		var isString = false;
		switch(type)
		{
			case "camera":
				property = "exif.cameraModelRef";
				break;
			case "lens":
				property = "exif.lensRef";
				break;
			case "focalLength":
				property = "exif.focalLength";
				break;
			case "iso":
				property = "exif.isoSpeedRating";
				break;
			case "aperture":
				property = "exif.aperture";
				break;
			case "flag":
				property = "images.pick"
				break;
			case "color":
				isString = true;
				property = "images.colorLabels"
				break;
			case "rating":
				property = "images.rating"
				break;
			case "face":
				property = "keyword.tag"
				break;
			case "date":
				property = "images.captureTime"
				break;
		}

		var expression = squel.expr();
		var filterValues = filter || [];

		if(!filterValues.length)
			return expression;

		switch(type)
		{
			case "camera":
			case "lens":
			case "flag":
			case "face":
			case "color":
				for (var i = 0; i < filterValues.length; i++) {
					if(filterValues[i] === null)
						expression = expression.or(property + " IS NULL");
					else
						expression = expression.or(property + " = " + ( isString ? "'" : "" ) + filterValues[i] + ( isString ? "'" : "" ));
				};
				break;
			case "focalLength":
			case "aperture":
			case "iso":
				if(filterValues[0] === filterValues[1]){
					expression = expression.and(property + " = " + filterValues[0])
				}
				else {
					expression = expression
						.and(property + " >= " + filterValues[0])
						.and(property + " <= " + filterValues[1])	
				}
				break;
			case "date":
				expression = expression
						.and(property + " >= '" + filterValues[0].format("YYYY-MM-DD") + "'")
						.and(property + " < '" + filterValues[1].add(1, 'days').format("YYYY-MM-DD") + "'")
				break;				
			case "rating":
				if(filterValues[0] === 0){
					expression = expression.and(property + " IS NULL")
					if(filterValues[1] !== 0)
						expression = expression
							.or(property + " >= 0")
							.and(property + " <= " + filterValues[1])
				}

				else if(filterValues[0] === filterValues[1]) {
					expression = expression
						.and(property + " = " + filterValues[0])
				}
				else {
					expression = expression
						.and(property + " >= " + filterValues[0])
						.and(property + " <= " + filterValues[1])
					}
				break;		
		}

		return expression;
	},
}