jest.mock('./api');

import React from 'react';
import Root from './root';
import renderer from 'react-test-renderer';

test('root render matches snapshot', () => {
	const component = renderer.create(
	<Root />,
	);
	let tree = component.toJSON();
	expect(tree).toMatchSnapshot();
});