import squel from 'squel';

export function getFilterExpression(type, filter) {
    let property;
    let isString = false;
    switch (type) {
        case 'camera':
            property = 'exif.cameraModelRef';
            break;
        case 'lens':
            property = 'exif.lensRef';
            break;
        case 'focalLength':
            property = 'exif.focalLength';
            break;
        case 'iso':
            property = 'exif.isoSpeedRating';
            break;
        case 'aperture':
            property = 'exif.aperture';
            break;
        case 'flag':
            property = 'images.pick';
            break;
        case 'color':
            isString = true;
            property = 'images.colorLabels';
            break;
        case 'rating':
            property = 'images.rating';
            break;
        case 'face':
            property = 'keyword.tag';
            break;
        case 'map':
            property = 'images.id_local';
            break;
        case 'date':
            property = 'images.captureTime';
            break;
        case 'shutter':
            property = 'exif.shutterSpeed';
            break;
        default:
            break;
    }

    let expression = squel.expr();
    const filterValues = filter || [];

    if (!filterValues.length) {
        return expression;
    }

    const minFilter = Math.min(filterValues[0], filterValues[1]);
    const maxFilter = Math.max(filterValues[0], filterValues[1]);

    switch (type) {
        case 'camera':
        case 'lens':
        case 'flag':
        case 'face':
        case 'color':
            for (let i = 0; i < filterValues.length; i++) {
                if (filterValues[i] === null) {
                    expression = expression.or(`${property} IS NULL`);
                } else if (isString === true) {
                    expression = expression.or(`${property} = "${filterValues[i]}"`);
                } else {
                    expression = expression.or(`${property} = ${filterValues[i]}`);
                }
            }
            break;
        case 'focalLength':
        case 'aperture':
        case 'iso':
        case 'shutter':
            if (filterValues[0] === filterValues[1]) {
                expression = expression.and(`${property} = ${minFilter}`);
            } else {
                expression = expression
                .and(`${property} >= ${minFilter}`)
                .and(`${property} <= ${maxFilter}`);
            }
            break;
        case 'date':
            expression = expression
            .and(`${property} >= "${minFilter.format('YYYY-MM-DD')}"`)
            .and(`${property} < "${maxFilter.add(1, 'days').format('YYYY-MM-DD')}"`);
            break;
        case 'rating':
            if (filterValues[0] === 0) {
                expression = expression.and(`${property} IS NULL`);
                if (filterValues[1] !== 0) {
                    expression = expression
                        .or(`${property} >= 0`)
                        .and(`${property} <= ${maxFilter}`);
                }
            } else if (filterValues[0] === filterValues[1]) {
                expression = expression
                    .and(`${property} = ${minFilter}`);
            } else {
                expression = expression
                    .and(`${property} >= ${minFilter}`)
                    .and(`${property} <= ${maxFilter}`);
            }
            break;
        case 'map':
            expression = expression.and(`${property} IN (${filterValues.join(', ')})`);
            break;
        default:
            break;
    }

    return expression;
}
