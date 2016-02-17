window.Utilities = {
	getFilterExpression(type, filter){
		var property;
		switch(type)
		{
			case "camera":
				property = "cameraModelRef";
				break;
			case "lens":
				property = "lensRef";
				break;
			case "focalLength":
				property = "focalLength";
				break;
			case "iso":
				property = "isoSpeedRating";
				break;
			case "aperture":
				property = "aperture";
				break;
		}

		var expression = squel.expr();
		var filterValues = filter || [];

		switch(type)
		{
			case "camera":
			case "lens":
				for (var i = 0; i < filterValues.length; i++) {
					expression = expression.or(property + " = " + filterValues[i]);
				};
				break;
			case "focalLength":
			case "aperture":
			case "iso":
				if(filterValues.length != 2 || !filterValues[0] || !filterValues[1])
					break;
				expression = expression
					.and(property + " >= " + filterValues[0])
					.and(property + " <= " + filterValues[1])
				break;
		}

		return expression;
	},
}