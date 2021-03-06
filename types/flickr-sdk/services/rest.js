/*!
 * Copyright 2019 SmugMug, Inc.
 * Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.
 */

var request = require('../lib/request');
var validate = require('../lib/validate');
var json = require('../plugins/json');

/**
 * Creates a superagent plugin that simply adds api_key to
 * the query string of every request.
 * @param {String} str
 * @returns {Function}
 * @private
 */

function createAPIKeyPlugin(str) {
	return function (req) {
		return req.query({ api_key: str });
	};
}

/**
 * Dedupes an array, set, or string of extras and returns
 * a comma separated version of it
 * @param {String|Array|Set} extras
 * @returns {Function}
 * @private
 */

function processExtras(extras) {
	if (
		typeof extras !== 'string' &&
		!Array.isArray(extras) &&
		!(extras instanceof Set)
	) {
		throw new Error('Invalid type for argument "extras"');
	}

	if (typeof extras === 'string') {
		extras = extras.split(',');
	}

	if (Array.isArray(extras)) {
		extras = new Set(extras);
	}

	if (extras instanceof Set) {
		return Array.from(extras).join(',');
	}
}

/**
 * Creates a new Flickr API client. This "client" is a factory
 * method that creates a new superagent request pre-configured
 * for talking to the Flickr API. You must pass an "auth"
 * supergent plugin.
 * @param {Function} auth
 * @returns {Function}
 * @private
 * @see https://github.com/visionmedia/superagent
 */

function createClient(auth, opts) {
	var host;

	// allow passing just an api key instead of a function
	if (typeof auth === 'string') {
		auth = createAPIKeyPlugin(auth);
	}

	if (typeof auth !== 'function') {
		throw new Error('Missing required argument "auth"');
	}

	// options
	opts = opts || {};
	host = opts.host || 'api.flickr.com';

	if (opts.port) {
		host += ':' + opts.port;
	}

	return function (verb, method, args) {
		if (typeof args === 'undefined') {
			args = {};
		}

		if (args.extras) {
			args.extras = processExtras(args.extras);
		}

		return request(verb, 'https://' + host + '/services/rest')
			.query({ method: method })
			.query(args)
			.use(json)
			.use(auth);
	};

}

/**
 * Creates a new Flickr REST API client.
 *
 * You **must** pass a superagent plugin or your API key as the first
 * parameter. For methods that don't require authentication, you can simply
 * provide your API key. For methods that do require authentication,
 * use the [OAuth plugin]{@link Flickr.OAuth.createPlugin}.
 *
 * @constructor
 * @param {Function|String} auth An authentication plugin function or an API key
 *
 * @example <caption>Get info about a public photo with your API key</caption>
 *
 * var flickr = new Flickr(process.env.FLICKR_API_KEY);
 *
 * flickr.photos.getInfo({
 *   photo_id: 25825763 // sorry, @dokas
 * }).then(function (res) {
 *   console.log('yay!', res.body);
 * }).catch(function (err) {
 *   console.error('bonk', err);
 * });
 *
 * @example <caption>Searching for public photos with your API key</caption>
 *
 * var flickr = new Flickr(process.env.FLICKR_API_KEY);
 *
 * flickr.photos.search({
 *   text: 'doggo'
 * }).then(function (res) {
 *   console.log('yay!', res.body);
 * }).catch(function (err) {
 *   console.error('bonk', err);
 * });
 *
 * @example <caption>Authenticate as a user with the OAuth plugin</caption>
 *
 * var flickr = new Flickr(Flickr.OAuth.createPlugin(
 *   process.env.FLICKR_CONSUMER_KEY,
 *   process.env.FLICKR_CONSUMER_SECRET,
 *   process.env.FLICKR_OAUTH_TOKEN,
 *   process.env.FLICKR_OAUTH_TOKEN_SECRET
 * ));
 *
 * flickr.test.login().then(function (res) {
 *   console.log('yay!', res.body);
 * }).catch(function (err) {
 *   console.error('bonk', err);
 * });
 *
 * @classdesc
 *
 * All of the [REST API][services/api] methods are available on the
 * [Flickr]{@link Flickr} prototype. Each method accepts a single parameter
 * which is an optional hash of arguments. Refer to the [REST API][services/api]
 * docs for the full list of methods and their supported arguments.
 *
 * | Method | Permissions | Required Arguments |
 * | --- | --- | --- |
 * | [flickr.activity.userComments](https://www.flickr.com/services/api/flickr.activity.userComments.html) | `read` :eyes: |  |
 * | [flickr.activity.userPhotos](https://www.flickr.com/services/api/flickr.activity.userPhotos.html) | `read` :eyes: |  |
 * | [flickr.auth.checkToken](https://www.flickr.com/services/api/flickr.auth.checkToken.html) | `none`  | `auth_token` |
 * | [flickr.auth.getFrob](https://www.flickr.com/services/api/flickr.auth.getFrob.html) | `none`  |  |
 * | [flickr.auth.getFullToken](https://www.flickr.com/services/api/flickr.auth.getFullToken.html) | `none`  | `mini_token` |
 * | [flickr.auth.getToken](https://www.flickr.com/services/api/flickr.auth.getToken.html) | `none`  | `frob` |
 * | [flickr.auth.oauth.checkToken](https://www.flickr.com/services/api/flickr.auth.oauth.checkToken.html) | `none`  | `oauth_token` |
 * | [flickr.auth.oauth.getAccessToken](https://www.flickr.com/services/api/flickr.auth.oauth.getAccessToken.html) | `none`  |  |
 * | [flickr.blogs.getList](https://www.flickr.com/services/api/flickr.blogs.getList.html) | `read` :eyes: |  |
 * | [flickr.blogs.getServices](https://www.flickr.com/services/api/flickr.blogs.getServices.html) | `none`  |  |
 * | [flickr.blogs.postPhoto](https://www.flickr.com/services/api/flickr.blogs.postPhoto.html) | `write` :pencil2: | `photo_id`, `title`, `description` |
 * | [flickr.cameras.getBrandModels](https://www.flickr.com/services/api/flickr.cameras.getBrandModels.html) | `none`  | `brand` |
 * | [flickr.cameras.getBrands](https://www.flickr.com/services/api/flickr.cameras.getBrands.html) | `none`  |  |
 * | [flickr.collections.getInfo](https://www.flickr.com/services/api/flickr.collections.getInfo.html) | `read` :eyes: | `collection_id` |
 * | [flickr.collections.getTree](https://www.flickr.com/services/api/flickr.collections.getTree.html) | `none`  |  |
 * | [flickr.commons.getInstitutions](https://www.flickr.com/services/api/flickr.commons.getInstitutions.html) | `none`  |  |
 * | [flickr.contacts.getList](https://www.flickr.com/services/api/flickr.contacts.getList.html) | `read` :eyes: |  |
 * | [flickr.contacts.getListRecentlyUploaded](https://www.flickr.com/services/api/flickr.contacts.getListRecentlyUploaded.html) | `read` :eyes: |  |
 * | [flickr.contacts.getPublicList](https://www.flickr.com/services/api/flickr.contacts.getPublicList.html) | `none`  | `user_id` |
 * | [flickr.contacts.getTaggingSuggestions](https://www.flickr.com/services/api/flickr.contacts.getTaggingSuggestions.html) | `read` :eyes: |  |
 * | [flickr.favorites.add](https://www.flickr.com/services/api/flickr.favorites.add.html) | `write` :pencil2: | `photo_id` |
 * | [flickr.favorites.getContext](https://www.flickr.com/services/api/flickr.favorites.getContext.html) | `none`  | `photo_id`, `user_id` |
 * | [flickr.favorites.getList](https://www.flickr.com/services/api/flickr.favorites.getList.html) | `none`  |  |
 * | [flickr.favorites.getPublicList](https://www.flickr.com/services/api/flickr.favorites.getPublicList.html) | `none`  | `user_id` |
 * | [flickr.favorites.remove](https://www.flickr.com/services/api/flickr.favorites.remove.html) | `write` :pencil2: | `photo_id` |
 * | [flickr.galleries.addPhoto](https://www.flickr.com/services/api/flickr.galleries.addPhoto.html) | `write` :pencil2: | `gallery_id`, `photo_id` |
 * | [flickr.galleries.create](https://www.flickr.com/services/api/flickr.galleries.create.html) | `write` :pencil2: | `title`, `description` |
 * | [flickr.galleries.editMeta](https://www.flickr.com/services/api/flickr.galleries.editMeta.html) | `write` :pencil2: | `gallery_id`, `title` |
 * | [flickr.galleries.editPhoto](https://www.flickr.com/services/api/flickr.galleries.editPhoto.html) | `write` :pencil2: | `gallery_id`, `photo_id`, `comment` |
 * | [flickr.galleries.editPhotos](https://www.flickr.com/services/api/flickr.galleries.editPhotos.html) | `write` :pencil2: | `gallery_id`, `primary_photo_id`, `photo_ids` |
 * | [flickr.galleries.getInfo](https://www.flickr.com/services/api/flickr.galleries.getInfo.html) | `none`  | `gallery_id` |
 * | [flickr.galleries.getList](https://www.flickr.com/services/api/flickr.galleries.getList.html) | `none`  | `user_id` |
 * | [flickr.galleries.getListForPhoto](https://www.flickr.com/services/api/flickr.galleries.getListForPhoto.html) | `none`  | `photo_id` |
 * | [flickr.galleries.getPhotos](https://www.flickr.com/services/api/flickr.galleries.getPhotos.html) | `none`  | `gallery_id` |
 * | [flickr.groups.browse](https://www.flickr.com/services/api/flickr.groups.browse.html) | `read` :eyes: |  |
 * | [flickr.groups.getInfo](https://www.flickr.com/services/api/flickr.groups.getInfo.html) | `none`  | `group_id` |
 * | [flickr.groups.join](https://www.flickr.com/services/api/flickr.groups.join.html) | `write` :pencil2: | `group_id` |
 * | [flickr.groups.joinRequest](https://www.flickr.com/services/api/flickr.groups.joinRequest.html) | `write` :pencil2: | `group_id`, `message`, `accept_rules` |
 * | [flickr.groups.leave](https://www.flickr.com/services/api/flickr.groups.leave.html) | `delete` :boom: | `group_id` |
 * | [flickr.groups.search](https://www.flickr.com/services/api/flickr.groups.search.html) | `none`  | `text` |
 * | [flickr.groups.discuss.replies.add](https://www.flickr.com/services/api/flickr.groups.discuss.replies.add.html) | `write` :pencil2: | `group_id`, `topic_id`, `message` |
 * | [flickr.groups.discuss.replies.delete](https://www.flickr.com/services/api/flickr.groups.discuss.replies.delete.html) | `delete` :boom: | `group_id`, `topic_id`, `reply_id` |
 * | [flickr.groups.discuss.replies.edit](https://www.flickr.com/services/api/flickr.groups.discuss.replies.edit.html) | `write` :pencil2: | `group_id`, `topic_id`, `reply_id`, `message` |
 * | [flickr.groups.discuss.replies.getInfo](https://www.flickr.com/services/api/flickr.groups.discuss.replies.getInfo.html) | `none`  | `group_id`, `topic_id`, `reply_id` |
 * | [flickr.groups.discuss.replies.getList](https://www.flickr.com/services/api/flickr.groups.discuss.replies.getList.html) | `none`  | `group_id`, `topic_id`, `per_page` |
 * | [flickr.groups.discuss.topics.add](https://www.flickr.com/services/api/flickr.groups.discuss.topics.add.html) | `write` :pencil2: | `group_id`, `subject`, `message` |
 * | [flickr.groups.discuss.topics.getInfo](https://www.flickr.com/services/api/flickr.groups.discuss.topics.getInfo.html) | `none`  | `group_id`, `topic_id` |
 * | [flickr.groups.discuss.topics.getList](https://www.flickr.com/services/api/flickr.groups.discuss.topics.getList.html) | `none`  | `group_id` |
 * | [flickr.groups.members.getList](https://www.flickr.com/services/api/flickr.groups.members.getList.html) | `read` :eyes: | `group_id` |
 * | [flickr.groups.pools.add](https://www.flickr.com/services/api/flickr.groups.pools.add.html) | `write` :pencil2: | `photo_id`, `group_id` |
 * | [flickr.groups.pools.getContext](https://www.flickr.com/services/api/flickr.groups.pools.getContext.html) | `none`  | `photo_id`, `group_id` |
 * | [flickr.groups.pools.getGroups](https://www.flickr.com/services/api/flickr.groups.pools.getGroups.html) | `read` :eyes: |  |
 * | [flickr.groups.pools.getPhotos](https://www.flickr.com/services/api/flickr.groups.pools.getPhotos.html) | `none`  | `group_id` |
 * | [flickr.groups.pools.remove](https://www.flickr.com/services/api/flickr.groups.pools.remove.html) | `write` :pencil2: | `photo_id`, `group_id` |
 * | [flickr.interestingness.getList](https://www.flickr.com/services/api/flickr.interestingness.getList.html) | `none`  |  |
 * | [flickr.machinetags.getNamespaces](https://www.flickr.com/services/api/flickr.machinetags.getNamespaces.html) | `none`  |  |
 * | [flickr.machinetags.getPairs](https://www.flickr.com/services/api/flickr.machinetags.getPairs.html) | `none`  |  |
 * | [flickr.machinetags.getPredicates](https://www.flickr.com/services/api/flickr.machinetags.getPredicates.html) | `none`  |  |
 * | [flickr.machinetags.getRecentValues](https://www.flickr.com/services/api/flickr.machinetags.getRecentValues.html) | `none`  |  |
 * | [flickr.machinetags.getValues](https://www.flickr.com/services/api/flickr.machinetags.getValues.html) | `none`  | `namespace`, `predicate` |
 * | [flickr.panda.getList](https://www.flickr.com/services/api/flickr.panda.getList.html) | `none`  |  |
 * | [flickr.panda.getPhotos](https://www.flickr.com/services/api/flickr.panda.getPhotos.html) | `none`  | `panda_name` |
 * | [flickr.people.findByEmail](https://www.flickr.com/services/api/flickr.people.findByEmail.html) | `none`  | `find_email` |
 * | [flickr.people.findByUsername](https://www.flickr.com/services/api/flickr.people.findByUsername.html) | `none`  | `username` |
 * | [flickr.people.getGroups](https://www.flickr.com/services/api/flickr.people.getGroups.html) | `read` :eyes: | `user_id` |
 * | [flickr.people.getInfo](https://www.flickr.com/services/api/flickr.people.getInfo.html) | `none`  | `user_id` |
 * | [flickr.people.getLimits](https://www.flickr.com/services/api/flickr.people.getLimits.html) | `read` :eyes: |  |
 * | [flickr.people.getPhotos](https://www.flickr.com/services/api/flickr.people.getPhotos.html) | `none`  | `user_id` |
 * | [flickr.people.getPhotosOf](https://www.flickr.com/services/api/flickr.people.getPhotosOf.html) | `none`  | `user_id` |
 * | [flickr.people.getPublicGroups](https://www.flickr.com/services/api/flickr.people.getPublicGroups.html) | `none`  | `user_id` |
 * | [flickr.people.getPublicPhotos](https://www.flickr.com/services/api/flickr.people.getPublicPhotos.html) | `none`  | `user_id` |
 * | [flickr.people.getUploadStatus](https://www.flickr.com/services/api/flickr.people.getUploadStatus.html) | `read` :eyes: |  |
 * | [flickr.photos.addTags](https://www.flickr.com/services/api/flickr.photos.addTags.html) | `write` :pencil2: | `photo_id`, `tags` |
 * | [flickr.photos.delete](https://www.flickr.com/services/api/flickr.photos.delete.html) | `delete` :boom: | `photo_id` |
 * | [flickr.photos.getAllContexts](https://www.flickr.com/services/api/flickr.photos.getAllContexts.html) | `none`  | `photo_id` |
 * | [flickr.photos.getContactsPhotos](https://www.flickr.com/services/api/flickr.photos.getContactsPhotos.html) | `read` :eyes: |  |
 * | [flickr.photos.getContactsPublicPhotos](https://www.flickr.com/services/api/flickr.photos.getContactsPublicPhotos.html) | `none`  | `user_id` |
 * | [flickr.photos.getContext](https://www.flickr.com/services/api/flickr.photos.getContext.html) | `none`  | `photo_id` |
 * | [flickr.photos.getCounts](https://www.flickr.com/services/api/flickr.photos.getCounts.html) | `read` :eyes: |  |
 * | [flickr.photos.getExif](https://www.flickr.com/services/api/flickr.photos.getExif.html) | `none`  | `photo_id` |
 * | [flickr.photos.getFavorites](https://www.flickr.com/services/api/flickr.photos.getFavorites.html) | `none`  | `photo_id` |
 * | [flickr.photos.getInfo](https://www.flickr.com/services/api/flickr.photos.getInfo.html) | `none`  | `photo_id` |
 * | [flickr.photos.getNotInSet](https://www.flickr.com/services/api/flickr.photos.getNotInSet.html) | `read` :eyes: |  |
 * | [flickr.photos.getPerms](https://www.flickr.com/services/api/flickr.photos.getPerms.html) | `read` :eyes: | `photo_id` |
 * | [flickr.photos.getPopular](https://www.flickr.com/services/api/flickr.photos.getPopular.html) | `none`  |  |
 * | [flickr.photos.getRecent](https://www.flickr.com/services/api/flickr.photos.getRecent.html) | `none`  |  |
 * | [flickr.photos.getSizes](https://www.flickr.com/services/api/flickr.photos.getSizes.html) | `none`  | `photo_id` |
 * | [flickr.photos.getUntagged](https://www.flickr.com/services/api/flickr.photos.getUntagged.html) | `read` :eyes: |  |
 * | [flickr.photos.getWithGeoData](https://www.flickr.com/services/api/flickr.photos.getWithGeoData.html) | `read` :eyes: |  |
 * | [flickr.photos.getWithoutGeoData](https://www.flickr.com/services/api/flickr.photos.getWithoutGeoData.html) | `read` :eyes: |  |
 * | [flickr.photos.recentlyUpdated](https://www.flickr.com/services/api/flickr.photos.recentlyUpdated.html) | `read` :eyes: | `min_date` |
 * | [flickr.photos.removeTag](https://www.flickr.com/services/api/flickr.photos.removeTag.html) | `write` :pencil2: | `tag_id` |
 * | [flickr.photos.search](https://www.flickr.com/services/api/flickr.photos.search.html) | `none`  |  |
 * | [flickr.photos.setContentType](https://www.flickr.com/services/api/flickr.photos.setContentType.html) | `write` :pencil2: | `photo_id`, `content_type` |
 * | [flickr.photos.setDates](https://www.flickr.com/services/api/flickr.photos.setDates.html) | `write` :pencil2: | `photo_id` |
 * | [flickr.photos.setMeta](https://www.flickr.com/services/api/flickr.photos.setMeta.html) | `write` :pencil2: | `photo_id` |
 * | [flickr.photos.setPerms](https://www.flickr.com/services/api/flickr.photos.setPerms.html) | `write` :pencil2: | `photo_id`, `is_public`, `is_friend`, `is_family` |
 * | [flickr.photos.setSafetyLevel](https://www.flickr.com/services/api/flickr.photos.setSafetyLevel.html) | `write` :pencil2: | `photo_id` |
 * | [flickr.photos.setTags](https://www.flickr.com/services/api/flickr.photos.setTags.html) | `write` :pencil2: | `photo_id`, `tags` |
 * | [flickr.photos.comments.addComment](https://www.flickr.com/services/api/flickr.photos.comments.addComment.html) | `write` :pencil2: | `photo_id`, `comment_text` |
 * | [flickr.photos.comments.deleteComment](https://www.flickr.com/services/api/flickr.photos.comments.deleteComment.html) | `write` :pencil2: | `comment_id` |
 * | [flickr.photos.comments.editComment](https://www.flickr.com/services/api/flickr.photos.comments.editComment.html) | `write` :pencil2: | `comment_id`, `comment_text` |
 * | [flickr.photos.comments.getList](https://www.flickr.com/services/api/flickr.photos.comments.getList.html) | `none`  | `photo_id` |
 * | [flickr.photos.comments.getRecentForContacts](https://www.flickr.com/services/api/flickr.photos.comments.getRecentForContacts.html) | `read` :eyes: |  |
 * | [flickr.photos.geo.batchCorrectLocation](https://www.flickr.com/services/api/flickr.photos.geo.batchCorrectLocation.html) | `write` :pencil2: | `lat`, `lon`, `accuracy` |
 * | [flickr.photos.geo.correctLocation](https://www.flickr.com/services/api/flickr.photos.geo.correctLocation.html) | `write` :pencil2: | `photo_id`, `foursquare_id` |
 * | [flickr.photos.geo.getLocation](https://www.flickr.com/services/api/flickr.photos.geo.getLocation.html) | `none`  | `photo_id` |
 * | [flickr.photos.geo.getPerms](https://www.flickr.com/services/api/flickr.photos.geo.getPerms.html) | `read` :eyes: | `photo_id` |
 * | [flickr.photos.geo.photosForLocation](https://www.flickr.com/services/api/flickr.photos.geo.photosForLocation.html) | `read` :eyes: | `lat`, `lon` |
 * | [flickr.photos.geo.removeLocation](https://www.flickr.com/services/api/flickr.photos.geo.removeLocation.html) | `write` :pencil2: | `photo_id` |
 * | [flickr.photos.geo.setContext](https://www.flickr.com/services/api/flickr.photos.geo.setContext.html) | `write` :pencil2: | `photo_id`, `context` |
 * | [flickr.photos.geo.setLocation](https://www.flickr.com/services/api/flickr.photos.geo.setLocation.html) | `write` :pencil2: | `photo_id`, `lat`, `lon` |
 * | [flickr.photos.geo.setPerms](https://www.flickr.com/services/api/flickr.photos.geo.setPerms.html) | `write` :pencil2: | `is_public`, `is_contact`, `is_friend`, `is_family`, `photo_id` |
 * | [flickr.photos.licenses.getInfo](https://www.flickr.com/services/api/flickr.photos.licenses.getInfo.html) | `none`  |  |
 * | [flickr.photos.licenses.setLicense](https://www.flickr.com/services/api/flickr.photos.licenses.setLicense.html) | `write` :pencil2: | `photo_id`, `license_id` |
 * | [flickr.photos.notes.add](https://www.flickr.com/services/api/flickr.photos.notes.add.html) | `write` :pencil2: | `photo_id`, `note_x`, `note_y`, `note_w`, `note_h`, `note_text` |
 * | [flickr.photos.notes.delete](https://www.flickr.com/services/api/flickr.photos.notes.delete.html) | `write` :pencil2: | `note_id` |
 * | [flickr.photos.notes.edit](https://www.flickr.com/services/api/flickr.photos.notes.edit.html) | `write` :pencil2: | `note_id`, `note_x`, `note_y`, `note_w`, `note_h`, `note_text` |
 * | [flickr.photos.people.add](https://www.flickr.com/services/api/flickr.photos.people.add.html) | `write` :pencil2: | `photo_id`, `user_id` |
 * | [flickr.photos.people.delete](https://www.flickr.com/services/api/flickr.photos.people.delete.html) | `write` :pencil2: | `photo_id`, `user_id` |
 * | [flickr.photos.people.deleteCoords](https://www.flickr.com/services/api/flickr.photos.people.deleteCoords.html) | `write` :pencil2: | `photo_id`, `user_id` |
 * | [flickr.photos.people.editCoords](https://www.flickr.com/services/api/flickr.photos.people.editCoords.html) | `write` :pencil2: | `photo_id`, `user_id`, `person_x`, `person_y`, `person_w`, `person_h` |
 * | [flickr.photos.people.getList](https://www.flickr.com/services/api/flickr.photos.people.getList.html) | `none`  | `photo_id` |
 * | [flickr.photos.suggestions.approveSuggestion](https://www.flickr.com/services/api/flickr.photos.suggestions.approveSuggestion.html) | `write` :pencil2: | `suggestion_id` |
 * | [flickr.photos.suggestions.getList](https://www.flickr.com/services/api/flickr.photos.suggestions.getList.html) | `read` :eyes: |  |
 * | [flickr.photos.suggestions.rejectSuggestion](https://www.flickr.com/services/api/flickr.photos.suggestions.rejectSuggestion.html) | `write` :pencil2: | `suggestion_id` |
 * | [flickr.photos.suggestions.removeSuggestion](https://www.flickr.com/services/api/flickr.photos.suggestions.removeSuggestion.html) | `write` :pencil2: | `suggestion_id` |
 * | [flickr.photos.suggestions.suggestLocation](https://www.flickr.com/services/api/flickr.photos.suggestions.suggestLocation.html) | `write` :pencil2: | `photo_id`, `lat`, `lon` |
 * | [flickr.photos.transform.rotate](https://www.flickr.com/services/api/flickr.photos.transform.rotate.html) | `write` :pencil2: | `photo_id`, `degrees` |
 * | [flickr.photos.upload.checkTickets](https://www.flickr.com/services/api/flickr.photos.upload.checkTickets.html) | `none`  | `tickets` |
 * | [flickr.photosets.addPhoto](https://www.flickr.com/services/api/flickr.photosets.addPhoto.html) | `write` :pencil2: | `photoset_id`, `photo_id` |
 * | [flickr.photosets.create](https://www.flickr.com/services/api/flickr.photosets.create.html) | `write` :pencil2: | `title`, `primary_photo_id` |
 * | [flickr.photosets.delete](https://www.flickr.com/services/api/flickr.photosets.delete.html) | `write` :pencil2: | `photoset_id` |
 * | [flickr.photosets.editMeta](https://www.flickr.com/services/api/flickr.photosets.editMeta.html) | `write` :pencil2: | `photoset_id`, `title` |
 * | [flickr.photosets.editPhotos](https://www.flickr.com/services/api/flickr.photosets.editPhotos.html) | `write` :pencil2: | `photoset_id`, `primary_photo_id`, `photo_ids` |
 * | [flickr.photosets.getContext](https://www.flickr.com/services/api/flickr.photosets.getContext.html) | `none`  | `photo_id`, `photoset_id` |
 * | [flickr.photosets.getInfo](https://www.flickr.com/services/api/flickr.photosets.getInfo.html) | `none`  | `photoset_id`, `user_id` |
 * | [flickr.photosets.getList](https://www.flickr.com/services/api/flickr.photosets.getList.html) | `none`  |  |
 * | [flickr.photosets.getPhotos](https://www.flickr.com/services/api/flickr.photosets.getPhotos.html) | `none`  | `photoset_id`, `user_id` |
 * | [flickr.photosets.orderSets](https://www.flickr.com/services/api/flickr.photosets.orderSets.html) | `write` :pencil2: | `photoset_ids` |
 * | [flickr.photosets.removePhoto](https://www.flickr.com/services/api/flickr.photosets.removePhoto.html) | `write` :pencil2: | `photoset_id`, `photo_id` |
 * | [flickr.photosets.removePhotos](https://www.flickr.com/services/api/flickr.photosets.removePhotos.html) | `write` :pencil2: | `photoset_id`, `photo_ids` |
 * | [flickr.photosets.reorderPhotos](https://www.flickr.com/services/api/flickr.photosets.reorderPhotos.html) | `write` :pencil2: | `photoset_id`, `photo_ids` |
 * | [flickr.photosets.setPrimaryPhoto](https://www.flickr.com/services/api/flickr.photosets.setPrimaryPhoto.html) | `write` :pencil2: | `photoset_id`, `photo_id` |
 * | [flickr.photosets.comments.addComment](https://www.flickr.com/services/api/flickr.photosets.comments.addComment.html) | `write` :pencil2: | `photoset_id`, `comment_text` |
 * | [flickr.photosets.comments.deleteComment](https://www.flickr.com/services/api/flickr.photosets.comments.deleteComment.html) | `write` :pencil2: | `comment_id` |
 * | [flickr.photosets.comments.editComment](https://www.flickr.com/services/api/flickr.photosets.comments.editComment.html) | `write` :pencil2: | `comment_id`, `comment_text` |
 * | [flickr.photosets.comments.getList](https://www.flickr.com/services/api/flickr.photosets.comments.getList.html) | `none`  | `photoset_id` |
 * | [flickr.places.find](https://www.flickr.com/services/api/flickr.places.find.html) | `none`  | `query` |
 * | [flickr.places.findByLatLon](https://www.flickr.com/services/api/flickr.places.findByLatLon.html) | `none`  | `lat`, `lon` |
 * | [flickr.places.getChildrenWithPhotosPublic](https://www.flickr.com/services/api/flickr.places.getChildrenWithPhotosPublic.html) | `none`  |  |
 * | [flickr.places.getInfo](https://www.flickr.com/services/api/flickr.places.getInfo.html) | `none`  |  |
 * | [flickr.places.getInfoByUrl](https://www.flickr.com/services/api/flickr.places.getInfoByUrl.html) | `none`  | `url` |
 * | [flickr.places.getPlaceTypes](https://www.flickr.com/services/api/flickr.places.getPlaceTypes.html) | `none`  |  |
 * | [flickr.places.getShapeHistory](https://www.flickr.com/services/api/flickr.places.getShapeHistory.html) | `none`  |  |
 * | [flickr.places.getTopPlacesList](https://www.flickr.com/services/api/flickr.places.getTopPlacesList.html) | `none`  | `place_type_id` |
 * | [flickr.places.placesForBoundingBox](https://www.flickr.com/services/api/flickr.places.placesForBoundingBox.html) | `none`  | `bbox` |
 * | [flickr.places.placesForContacts](https://www.flickr.com/services/api/flickr.places.placesForContacts.html) | `read` :eyes: |  |
 * | [flickr.places.placesForTags](https://www.flickr.com/services/api/flickr.places.placesForTags.html) | `none`  | `place_type_id` |
 * | [flickr.places.placesForUser](https://www.flickr.com/services/api/flickr.places.placesForUser.html) | `read` :eyes: |  |
 * | [flickr.places.resolvePlaceId](https://www.flickr.com/services/api/flickr.places.resolvePlaceId.html) | `none`  | `place_id` |
 * | [flickr.places.resolvePlaceURL](https://www.flickr.com/services/api/flickr.places.resolvePlaceURL.html) | `none`  | `url` |
 * | [flickr.places.tagsForPlace](https://www.flickr.com/services/api/flickr.places.tagsForPlace.html) | `none`  |  |
 * | [flickr.prefs.getContentType](https://www.flickr.com/services/api/flickr.prefs.getContentType.html) | `read` :eyes: |  |
 * | [flickr.prefs.getGeoPerms](https://www.flickr.com/services/api/flickr.prefs.getGeoPerms.html) | `read` :eyes: |  |
 * | [flickr.prefs.getHidden](https://www.flickr.com/services/api/flickr.prefs.getHidden.html) | `read` :eyes: |  |
 * | [flickr.prefs.getPrivacy](https://www.flickr.com/services/api/flickr.prefs.getPrivacy.html) | `read` :eyes: |  |
 * | [flickr.prefs.getSafetyLevel](https://www.flickr.com/services/api/flickr.prefs.getSafetyLevel.html) | `read` :eyes: |  |
 * | [flickr.profile.getProfile](https://www.flickr.com/services/api/flickr.profile.getProfile.html) | `none`  | `user_id` |
 * | [flickr.push.getSubscriptions](https://www.flickr.com/services/api/flickr.push.getSubscriptions.html) | `read` :eyes: |  |
 * | [flickr.push.getTopics](https://www.flickr.com/services/api/flickr.push.getTopics.html) | `none`  |  |
 * | [flickr.push.subscribe](https://www.flickr.com/services/api/flickr.push.subscribe.html) | `read` :eyes: | `topic`, `callback`, `verify` |
 * | [flickr.push.unsubscribe](https://www.flickr.com/services/api/flickr.push.unsubscribe.html) | `read` :eyes: | `topic`, `callback`, `verify` |
 * | [flickr.reflection.getMethodInfo](https://www.flickr.com/services/api/flickr.reflection.getMethodInfo.html) | `none`  | `method_name` |
 * | [flickr.reflection.getMethods](https://www.flickr.com/services/api/flickr.reflection.getMethods.html) | `none`  |  |
 * | [flickr.stats.getCSVFiles](https://www.flickr.com/services/api/flickr.stats.getCSVFiles.html) | `read` :eyes: |  |
 * | [flickr.stats.getCollectionDomains](https://www.flickr.com/services/api/flickr.stats.getCollectionDomains.html) | `read` :eyes: | `date` |
 * | [flickr.stats.getCollectionReferrers](https://www.flickr.com/services/api/flickr.stats.getCollectionReferrers.html) | `read` :eyes: | `date`, `domain` |
 * | [flickr.stats.getCollectionStats](https://www.flickr.com/services/api/flickr.stats.getCollectionStats.html) | `read` :eyes: | `date`, `collection_id` |
 * | [flickr.stats.getPhotoDomains](https://www.flickr.com/services/api/flickr.stats.getPhotoDomains.html) | `read` :eyes: | `date` |
 * | [flickr.stats.getPhotoReferrers](https://www.flickr.com/services/api/flickr.stats.getPhotoReferrers.html) | `read` :eyes: | `date`, `domain` |
 * | [flickr.stats.getPhotoStats](https://www.flickr.com/services/api/flickr.stats.getPhotoStats.html) | `read` :eyes: | `date`, `photo_id` |
 * | [flickr.stats.getPhotosetDomains](https://www.flickr.com/services/api/flickr.stats.getPhotosetDomains.html) | `read` :eyes: | `date` |
 * | [flickr.stats.getPhotosetReferrers](https://www.flickr.com/services/api/flickr.stats.getPhotosetReferrers.html) | `read` :eyes: | `date`, `domain` |
 * | [flickr.stats.getPhotosetStats](https://www.flickr.com/services/api/flickr.stats.getPhotosetStats.html) | `read` :eyes: | `date`, `photoset_id` |
 * | [flickr.stats.getPhotostreamDomains](https://www.flickr.com/services/api/flickr.stats.getPhotostreamDomains.html) | `read` :eyes: | `date` |
 * | [flickr.stats.getPhotostreamReferrers](https://www.flickr.com/services/api/flickr.stats.getPhotostreamReferrers.html) | `read` :eyes: | `date`, `domain` |
 * | [flickr.stats.getPhotostreamStats](https://www.flickr.com/services/api/flickr.stats.getPhotostreamStats.html) | `read` :eyes: | `date` |
 * | [flickr.stats.getPopularPhotos](https://www.flickr.com/services/api/flickr.stats.getPopularPhotos.html) | `read` :eyes: |  |
 * | [flickr.stats.getTotalViews](https://www.flickr.com/services/api/flickr.stats.getTotalViews.html) | `read` :eyes: |  |
 * | [flickr.tags.getClusterPhotos](https://www.flickr.com/services/api/flickr.tags.getClusterPhotos.html) | `none`  | `tag`, `cluster_id` |
 * | [flickr.tags.getClusters](https://www.flickr.com/services/api/flickr.tags.getClusters.html) | `none`  | `tag` |
 * | [flickr.tags.getHotList](https://www.flickr.com/services/api/flickr.tags.getHotList.html) | `none`  |  |
 * | [flickr.tags.getListPhoto](https://www.flickr.com/services/api/flickr.tags.getListPhoto.html) | `none`  | `photo_id` |
 * | [flickr.tags.getListUser](https://www.flickr.com/services/api/flickr.tags.getListUser.html) | `none`  |  |
 * | [flickr.tags.getListUserPopular](https://www.flickr.com/services/api/flickr.tags.getListUserPopular.html) | `none`  |  |
 * | [flickr.tags.getListUserRaw](https://www.flickr.com/services/api/flickr.tags.getListUserRaw.html) | `none`  |  |
 * | [flickr.tags.getMostFrequentlyUsed](https://www.flickr.com/services/api/flickr.tags.getMostFrequentlyUsed.html) | `read` :eyes: |  |
 * | [flickr.tags.getRelated](https://www.flickr.com/services/api/flickr.tags.getRelated.html) | `none`  | `tag` |
 * | [flickr.test.echo](https://www.flickr.com/services/api/flickr.test.echo.html) | `none`  |  |
 * | [flickr.test.login](https://www.flickr.com/services/api/flickr.test.login.html) | `read` :eyes: |  |
 * | [flickr.test.null](https://www.flickr.com/services/api/flickr.test.null.html) | `read` :eyes: |  |
 * | [flickr.testimonials.addTestimonial](https://www.flickr.com/services/api/flickr.testimonials.addTestimonial.html) | `write` :pencil2: | `user_id`, `testimonial_text` |
 * | [flickr.testimonials.approveTestimonial](https://www.flickr.com/services/api/flickr.testimonials.approveTestimonial.html) | `write` :pencil2: | `testimonial_id` |
 * | [flickr.testimonials.deleteTestimonial](https://www.flickr.com/services/api/flickr.testimonials.deleteTestimonial.html) | `write` :pencil2: | `testimonial_id` |
 * | [flickr.testimonials.editTestimonial](https://www.flickr.com/services/api/flickr.testimonials.editTestimonial.html) | `write` :pencil2: | `user_id`, `testimonial_id`, `testimonial_text` |
 * | [flickr.testimonials.getAllTestimonialsAbout](https://www.flickr.com/services/api/flickr.testimonials.getAllTestimonialsAbout.html) | `read` :eyes: |  |
 * | [flickr.testimonials.getAllTestimonialsAboutBy](https://www.flickr.com/services/api/flickr.testimonials.getAllTestimonialsAboutBy.html) | `read` :eyes: | `user_id` |
 * | [flickr.testimonials.getAllTestimonialsBy](https://www.flickr.com/services/api/flickr.testimonials.getAllTestimonialsBy.html) | `read` :eyes: |  |
 * | [flickr.testimonials.getPendingTestimonialsAbout](https://www.flickr.com/services/api/flickr.testimonials.getPendingTestimonialsAbout.html) | `read` :eyes: |  |
 * | [flickr.testimonials.getPendingTestimonialsAboutBy](https://www.flickr.com/services/api/flickr.testimonials.getPendingTestimonialsAboutBy.html) | `read` :eyes: | `user_id` |
 * | [flickr.testimonials.getPendingTestimonialsBy](https://www.flickr.com/services/api/flickr.testimonials.getPendingTestimonialsBy.html) | `read` :eyes: |  |
 * | [flickr.testimonials.getTestimonialsAbout](https://www.flickr.com/services/api/flickr.testimonials.getTestimonialsAbout.html) | `none`  | `user_id` |
 * | [flickr.testimonials.getTestimonialsAboutBy](https://www.flickr.com/services/api/flickr.testimonials.getTestimonialsAboutBy.html) | `read` :eyes: | `user_id` |
 * | [flickr.testimonials.getTestimonialsBy](https://www.flickr.com/services/api/flickr.testimonials.getTestimonialsBy.html) | `none`  | `user_id` |
 * | [flickr.urls.getGroup](https://www.flickr.com/services/api/flickr.urls.getGroup.html) | `none`  | `group_id` |
 * | [flickr.urls.getUserPhotos](https://www.flickr.com/services/api/flickr.urls.getUserPhotos.html) | `none`  |  |
 * | [flickr.urls.getUserProfile](https://www.flickr.com/services/api/flickr.urls.getUserProfile.html) | `none`  |  |
 * | [flickr.urls.lookupGallery](https://www.flickr.com/services/api/flickr.urls.lookupGallery.html) | `none`  | `url` |
 * | [flickr.urls.lookupGroup](https://www.flickr.com/services/api/flickr.urls.lookupGroup.html) | `none`  | `url` |
 * | [flickr.urls.lookupUser](https://www.flickr.com/services/api/flickr.urls.lookupUser.html) | `none`  | `url` |
 */

function Flickr(auth, opts) {

	// allow creating a client without `new`
	if (!(this instanceof Flickr)) {
		return new Flickr(auth);
	}

	// create a new client and assign it to all of our namespaces
	this.activity._ =
	this.auth._ =
	this.auth.oauth._ =
	this.blogs._ =
	this.cameras._ =
	this.collections._ =
	this.commons._ =
	this.contacts._ =
	this.favorites._ =
	this.galleries._ =
	this.groups._ =
	this.groups.discuss._ =
	this.groups.discuss.replies._ =
	this.groups.discuss.topics._ =
	this.groups.members._ =
	this.groups.pools._ =
	this.interestingness._ =
	this.machinetags._ =
	this.panda._ =
	this.people._ =
	this.photos._ =
	this.photos.comments._ =
	this.photos.geo._ =
	this.photos.licenses._ =
	this.photos.notes._ =
	this.photos.people._ =
	this.photos.suggestions._ =
	this.photos.transform._ =
	this.photos.upload._ =
	this.photosets._ =
	this.photosets.comments._ =
	this.places._ =
	this.prefs._ =
	this.profile._ =
	this.push._ =
	this.reflection._ =
	this.stats._ =
	this.tags._ =
	this.test._ =
	this.testimonials._ =
	this.urls._ =
	this._ = // create passthrough for future/undocumented endpoints
		createClient(auth, opts);
}


/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.activity = {};

/**
 * flickr.activity.userComments
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.activity.userComments.html
 */

Flickr.prototype.activity.userComments = function (args) {
	return this._('GET', 'flickr.activity.userComments', args);
};

/**
 * flickr.activity.userPhotos
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.activity.userPhotos.html
 */

Flickr.prototype.activity.userPhotos = function (args) {
	return this._('GET', 'flickr.activity.userPhotos', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.auth = {};

/**
 * flickr.auth.checkToken
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.auth.checkToken.html
 */

Flickr.prototype.auth.checkToken = function (args) {
	validate(args, 'auth_token');
	return this._('GET', 'flickr.auth.checkToken', args);
};

/**
 * flickr.auth.getFrob
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.auth.getFrob.html
 */

Flickr.prototype.auth.getFrob = function (args) {
	return this._('GET', 'flickr.auth.getFrob', args);
};

/**
 * flickr.auth.getFullToken
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.auth.getFullToken.html
 */

Flickr.prototype.auth.getFullToken = function (args) {
	validate(args, 'mini_token');
	return this._('GET', 'flickr.auth.getFullToken', args);
};

/**
 * flickr.auth.getToken
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.auth.getToken.html
 */

Flickr.prototype.auth.getToken = function (args) {
	validate(args, 'frob');
	return this._('GET', 'flickr.auth.getToken', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.auth.oauth = {};

/**
 * flickr.auth.oauth.checkToken
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.auth.oauth.checkToken.html
 */

Flickr.prototype.auth.oauth.checkToken = function (args) {
	validate(args, 'oauth_token');
	return this._('GET', 'flickr.auth.oauth.checkToken', args);
};

/**
 * flickr.auth.oauth.getAccessToken
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.auth.oauth.getAccessToken.html
 */

Flickr.prototype.auth.oauth.getAccessToken = function (args) {
	return this._('GET', 'flickr.auth.oauth.getAccessToken', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.blogs = {};

/**
 * flickr.blogs.getList
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.blogs.getList.html
 */

Flickr.prototype.blogs.getList = function (args) {
	return this._('GET', 'flickr.blogs.getList', args);
};

/**
 * flickr.blogs.getServices
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.blogs.getServices.html
 */

Flickr.prototype.blogs.getServices = function (args) {
	return this._('GET', 'flickr.blogs.getServices', args);
};

/**
 * flickr.blogs.postPhoto
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.blogs.postPhoto.html
 */

Flickr.prototype.blogs.postPhoto = function (args) {
	validate(args, 'photo_id');
	validate(args, 'title');
	validate(args, 'description');
	return this._('POST', 'flickr.blogs.postPhoto', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.cameras = {};

/**
 * flickr.cameras.getBrandModels
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.cameras.getBrandModels.html
 */

Flickr.prototype.cameras.getBrandModels = function (args) {
	validate(args, 'brand');
	return this._('GET', 'flickr.cameras.getBrandModels', args);
};

/**
 * flickr.cameras.getBrands
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.cameras.getBrands.html
 */

Flickr.prototype.cameras.getBrands = function (args) {
	return this._('GET', 'flickr.cameras.getBrands', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.collections = {};

/**
 * flickr.collections.getInfo
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.collections.getInfo.html
 */

Flickr.prototype.collections.getInfo = function (args) {
	validate(args, 'collection_id');
	return this._('GET', 'flickr.collections.getInfo', args);
};

/**
 * flickr.collections.getTree
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.collections.getTree.html
 */

Flickr.prototype.collections.getTree = function (args) {
	return this._('GET', 'flickr.collections.getTree', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.commons = {};

/**
 * flickr.commons.getInstitutions
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.commons.getInstitutions.html
 */

Flickr.prototype.commons.getInstitutions = function (args) {
	return this._('GET', 'flickr.commons.getInstitutions', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.contacts = {};

/**
 * flickr.contacts.getList
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.contacts.getList.html
 */

Flickr.prototype.contacts.getList = function (args) {
	return this._('GET', 'flickr.contacts.getList', args);
};

/**
 * flickr.contacts.getListRecentlyUploaded
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.contacts.getListRecentlyUploaded.html
 */

Flickr.prototype.contacts.getListRecentlyUploaded = function (args) {
	return this._('GET', 'flickr.contacts.getListRecentlyUploaded', args);
};

/**
 * flickr.contacts.getPublicList
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.contacts.getPublicList.html
 */

Flickr.prototype.contacts.getPublicList = function (args) {
	validate(args, 'user_id');
	return this._('GET', 'flickr.contacts.getPublicList', args);
};

/**
 * flickr.contacts.getTaggingSuggestions
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.contacts.getTaggingSuggestions.html
 */

Flickr.prototype.contacts.getTaggingSuggestions = function (args) {
	return this._('GET', 'flickr.contacts.getTaggingSuggestions', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.favorites = {};

/**
 * flickr.favorites.add
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.favorites.add.html
 */

Flickr.prototype.favorites.add = function (args) {
	validate(args, 'photo_id');
	return this._('POST', 'flickr.favorites.add', args);
};

/**
 * flickr.favorites.getContext
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.favorites.getContext.html
 */

Flickr.prototype.favorites.getContext = function (args) {
	validate(args, 'photo_id');
	validate(args, 'user_id');
	return this._('GET', 'flickr.favorites.getContext', args);
};

/**
 * flickr.favorites.getList
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.favorites.getList.html
 */

Flickr.prototype.favorites.getList = function (args) {
	return this._('GET', 'flickr.favorites.getList', args);
};

/**
 * flickr.favorites.getPublicList
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.favorites.getPublicList.html
 */

Flickr.prototype.favorites.getPublicList = function (args) {
	validate(args, 'user_id');
	return this._('GET', 'flickr.favorites.getPublicList', args);
};

/**
 * flickr.favorites.remove
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.favorites.remove.html
 */

Flickr.prototype.favorites.remove = function (args) {
	validate(args, 'photo_id');
	return this._('POST', 'flickr.favorites.remove', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.galleries = {};

/**
 * flickr.galleries.addPhoto
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.galleries.addPhoto.html
 */

Flickr.prototype.galleries.addPhoto = function (args) {
	validate(args, 'gallery_id');
	validate(args, 'photo_id');
	return this._('POST', 'flickr.galleries.addPhoto', args);
};

/**
 * flickr.galleries.create
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.galleries.create.html
 */

Flickr.prototype.galleries.create = function (args) {
	validate(args, 'title');
	validate(args, 'description');
	return this._('POST', 'flickr.galleries.create', args);
};

/**
 * flickr.galleries.editMeta
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.galleries.editMeta.html
 */

Flickr.prototype.galleries.editMeta = function (args) {
	validate(args, 'gallery_id');
	validate(args, 'title');
	return this._('POST', 'flickr.galleries.editMeta', args);
};

/**
 * flickr.galleries.editPhoto
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.galleries.editPhoto.html
 */

Flickr.prototype.galleries.editPhoto = function (args) {
	validate(args, 'gallery_id');
	validate(args, 'photo_id');
	validate(args, 'comment');
	return this._('POST', 'flickr.galleries.editPhoto', args);
};

/**
 * flickr.galleries.editPhotos
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.galleries.editPhotos.html
 */

Flickr.prototype.galleries.editPhotos = function (args) {
	validate(args, 'gallery_id');
	validate(args, 'primary_photo_id');
	validate(args, 'photo_ids');
	return this._('POST', 'flickr.galleries.editPhotos', args);
};

/**
 * flickr.galleries.getInfo
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.galleries.getInfo.html
 */

Flickr.prototype.galleries.getInfo = function (args) {
	validate(args, 'gallery_id');
	return this._('GET', 'flickr.galleries.getInfo', args);
};

/**
 * flickr.galleries.getList
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.galleries.getList.html
 */

Flickr.prototype.galleries.getList = function (args) {
	validate(args, 'user_id');
	return this._('GET', 'flickr.galleries.getList', args);
};

/**
 * flickr.galleries.getListForPhoto
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.galleries.getListForPhoto.html
 */

Flickr.prototype.galleries.getListForPhoto = function (args) {
	validate(args, 'photo_id');
	return this._('GET', 'flickr.galleries.getListForPhoto', args);
};

/**
 * flickr.galleries.getPhotos
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.galleries.getPhotos.html
 */

Flickr.prototype.galleries.getPhotos = function (args) {
	validate(args, 'gallery_id');
	return this._('GET', 'flickr.galleries.getPhotos', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.groups = {};

/**
 * flickr.groups.browse
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.groups.browse.html
 */

Flickr.prototype.groups.browse = function (args) {
	return this._('GET', 'flickr.groups.browse', args);
};

/**
 * flickr.groups.getInfo
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.groups.getInfo.html
 */

Flickr.prototype.groups.getInfo = function (args) {
	validate(args, 'group_id');
	return this._('GET', 'flickr.groups.getInfo', args);
};

/**
 * flickr.groups.join
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.groups.join.html
 */

Flickr.prototype.groups.join = function (args) {
	validate(args, 'group_id');
	return this._('POST', 'flickr.groups.join', args);
};

/**
 * flickr.groups.joinRequest
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.groups.joinRequest.html
 */

Flickr.prototype.groups.joinRequest = function (args) {
	validate(args, 'group_id');
	validate(args, 'message');
	validate(args, 'accept_rules');
	return this._('POST', 'flickr.groups.joinRequest', args);
};

/**
 * flickr.groups.leave
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.groups.leave.html
 */

Flickr.prototype.groups.leave = function (args) {
	validate(args, 'group_id');
	return this._('POST', 'flickr.groups.leave', args);
};

/**
 * flickr.groups.search
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.groups.search.html
 */

Flickr.prototype.groups.search = function (args) {
	validate(args, 'text');
	return this._('GET', 'flickr.groups.search', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.groups.discuss = {};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.groups.discuss.replies = {};

/**
 * flickr.groups.discuss.replies.add
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.groups.discuss.replies.add.html
 */

Flickr.prototype.groups.discuss.replies.add = function (args) {
	validate(args, 'group_id');
	validate(args, 'topic_id');
	validate(args, 'message');
	return this._('POST', 'flickr.groups.discuss.replies.add', args);
};

/**
 * flickr.groups.discuss.replies.delete
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.groups.discuss.replies.delete.html
 */

Flickr.prototype.groups.discuss.replies.delete = function (args) {
	validate(args, 'group_id');
	validate(args, 'topic_id');
	validate(args, 'reply_id');
	return this._('POST', 'flickr.groups.discuss.replies.delete', args);
};

/**
 * flickr.groups.discuss.replies.edit
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.groups.discuss.replies.edit.html
 */

Flickr.prototype.groups.discuss.replies.edit = function (args) {
	validate(args, 'group_id');
	validate(args, 'topic_id');
	validate(args, 'reply_id');
	validate(args, 'message');
	return this._('POST', 'flickr.groups.discuss.replies.edit', args);
};

/**
 * flickr.groups.discuss.replies.getInfo
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.groups.discuss.replies.getInfo.html
 */

Flickr.prototype.groups.discuss.replies.getInfo = function (args) {
	validate(args, 'group_id');
	validate(args, 'topic_id');
	validate(args, 'reply_id');
	return this._('GET', 'flickr.groups.discuss.replies.getInfo', args);
};

/**
 * flickr.groups.discuss.replies.getList
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.groups.discuss.replies.getList.html
 */

Flickr.prototype.groups.discuss.replies.getList = function (args) {
	validate(args, 'group_id');
	validate(args, 'topic_id');
	validate(args, 'per_page');
	return this._('GET', 'flickr.groups.discuss.replies.getList', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.groups.discuss.topics = {};

/**
 * flickr.groups.discuss.topics.add
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.groups.discuss.topics.add.html
 */

Flickr.prototype.groups.discuss.topics.add = function (args) {
	validate(args, 'group_id');
	validate(args, 'subject');
	validate(args, 'message');
	return this._('POST', 'flickr.groups.discuss.topics.add', args);
};

/**
 * flickr.groups.discuss.topics.getInfo
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.groups.discuss.topics.getInfo.html
 */

Flickr.prototype.groups.discuss.topics.getInfo = function (args) {
	validate(args, 'group_id');
	validate(args, 'topic_id');
	return this._('GET', 'flickr.groups.discuss.topics.getInfo', args);
};

/**
 * flickr.groups.discuss.topics.getList
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.groups.discuss.topics.getList.html
 */

Flickr.prototype.groups.discuss.topics.getList = function (args) {
	validate(args, 'group_id');
	return this._('GET', 'flickr.groups.discuss.topics.getList', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.groups.members = {};

/**
 * flickr.groups.members.getList
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.groups.members.getList.html
 */

Flickr.prototype.groups.members.getList = function (args) {
	validate(args, 'group_id');
	return this._('GET', 'flickr.groups.members.getList', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.groups.pools = {};

/**
 * flickr.groups.pools.add
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.groups.pools.add.html
 */

Flickr.prototype.groups.pools.add = function (args) {
	validate(args, 'photo_id');
	validate(args, 'group_id');
	return this._('POST', 'flickr.groups.pools.add', args);
};

/**
 * flickr.groups.pools.getContext
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.groups.pools.getContext.html
 */

Flickr.prototype.groups.pools.getContext = function (args) {
	validate(args, 'photo_id');
	validate(args, 'group_id');
	return this._('GET', 'flickr.groups.pools.getContext', args);
};

/**
 * flickr.groups.pools.getGroups
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.groups.pools.getGroups.html
 */

Flickr.prototype.groups.pools.getGroups = function (args) {
	return this._('GET', 'flickr.groups.pools.getGroups', args);
};

/**
 * flickr.groups.pools.getPhotos
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.groups.pools.getPhotos.html
 */

Flickr.prototype.groups.pools.getPhotos = function (args) {
	validate(args, 'group_id');
	return this._('GET', 'flickr.groups.pools.getPhotos', args);
};

/**
 * flickr.groups.pools.remove
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.groups.pools.remove.html
 */

Flickr.prototype.groups.pools.remove = function (args) {
	validate(args, 'photo_id');
	validate(args, 'group_id');
	return this._('POST', 'flickr.groups.pools.remove', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.interestingness = {};

/**
 * flickr.interestingness.getList
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.interestingness.getList.html
 */

Flickr.prototype.interestingness.getList = function (args) {
	return this._('GET', 'flickr.interestingness.getList', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.machinetags = {};

/**
 * flickr.machinetags.getNamespaces
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.machinetags.getNamespaces.html
 */

Flickr.prototype.machinetags.getNamespaces = function (args) {
	return this._('GET', 'flickr.machinetags.getNamespaces', args);
};

/**
 * flickr.machinetags.getPairs
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.machinetags.getPairs.html
 */

Flickr.prototype.machinetags.getPairs = function (args) {
	return this._('GET', 'flickr.machinetags.getPairs', args);
};

/**
 * flickr.machinetags.getPredicates
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.machinetags.getPredicates.html
 */

Flickr.prototype.machinetags.getPredicates = function (args) {
	return this._('GET', 'flickr.machinetags.getPredicates', args);
};

/**
 * flickr.machinetags.getRecentValues
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.machinetags.getRecentValues.html
 */

Flickr.prototype.machinetags.getRecentValues = function (args) {
	return this._('GET', 'flickr.machinetags.getRecentValues', args);
};

/**
 * flickr.machinetags.getValues
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.machinetags.getValues.html
 */

Flickr.prototype.machinetags.getValues = function (args) {
	validate(args, 'namespace');
	validate(args, 'predicate');
	return this._('GET', 'flickr.machinetags.getValues', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.panda = {};

/**
 * flickr.panda.getList
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.panda.getList.html
 */

Flickr.prototype.panda.getList = function (args) {
	return this._('GET', 'flickr.panda.getList', args);
};

/**
 * flickr.panda.getPhotos
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.panda.getPhotos.html
 */

Flickr.prototype.panda.getPhotos = function (args) {
	validate(args, 'panda_name');
	return this._('GET', 'flickr.panda.getPhotos', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.people = {};

/**
 * flickr.people.findByEmail
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.people.findByEmail.html
 */

Flickr.prototype.people.findByEmail = function (args) {
	validate(args, 'find_email');
	return this._('GET', 'flickr.people.findByEmail', args);
};

/**
 * flickr.people.findByUsername
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.people.findByUsername.html
 */

Flickr.prototype.people.findByUsername = function (args) {
	validate(args, 'username');
	return this._('GET', 'flickr.people.findByUsername', args);
};

/**
 * flickr.people.getGroups
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.people.getGroups.html
 */

Flickr.prototype.people.getGroups = function (args) {
	validate(args, 'user_id');
	return this._('GET', 'flickr.people.getGroups', args);
};

/**
 * flickr.people.getInfo
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.people.getInfo.html
 */

Flickr.prototype.people.getInfo = function (args) {
	validate(args, 'user_id');
	return this._('GET', 'flickr.people.getInfo', args);
};

/**
 * flickr.people.getLimits
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.people.getLimits.html
 */

Flickr.prototype.people.getLimits = function (args) {
	return this._('GET', 'flickr.people.getLimits', args);
};

/**
 * flickr.people.getPhotos
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.people.getPhotos.html
 */

Flickr.prototype.people.getPhotos = function (args) {
	validate(args, 'user_id');
	return this._('GET', 'flickr.people.getPhotos', args);
};

/**
 * flickr.people.getPhotosOf
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.people.getPhotosOf.html
 */

Flickr.prototype.people.getPhotosOf = function (args) {
	validate(args, 'user_id');
	return this._('GET', 'flickr.people.getPhotosOf', args);
};

/**
 * flickr.people.getPublicGroups
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.people.getPublicGroups.html
 */

Flickr.prototype.people.getPublicGroups = function (args) {
	validate(args, 'user_id');
	return this._('GET', 'flickr.people.getPublicGroups', args);
};

/**
 * flickr.people.getPublicPhotos
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.people.getPublicPhotos.html
 */

Flickr.prototype.people.getPublicPhotos = function (args) {
	validate(args, 'user_id');
	return this._('GET', 'flickr.people.getPublicPhotos', args);
};

/**
 * flickr.people.getUploadStatus
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.people.getUploadStatus.html
 */

Flickr.prototype.people.getUploadStatus = function (args) {
	return this._('GET', 'flickr.people.getUploadStatus', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.photos = {};

/**
 * flickr.photos.addTags
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.addTags.html
 */

Flickr.prototype.photos.addTags = function (args) {
	validate(args, 'photo_id');
	validate(args, 'tags');
	return this._('POST', 'flickr.photos.addTags', args);
};

/**
 * flickr.photos.delete
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.delete.html
 */

Flickr.prototype.photos.delete = function (args) {
	validate(args, 'photo_id');
	return this._('POST', 'flickr.photos.delete', args);
};

/**
 * flickr.photos.getAllContexts
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.getAllContexts.html
 */

Flickr.prototype.photos.getAllContexts = function (args) {
	validate(args, 'photo_id');
	return this._('GET', 'flickr.photos.getAllContexts', args);
};

/**
 * flickr.photos.getContactsPhotos
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.getContactsPhotos.html
 */

Flickr.prototype.photos.getContactsPhotos = function (args) {
	return this._('GET', 'flickr.photos.getContactsPhotos', args);
};

/**
 * flickr.photos.getContactsPublicPhotos
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.getContactsPublicPhotos.html
 */

Flickr.prototype.photos.getContactsPublicPhotos = function (args) {
	validate(args, 'user_id');
	return this._('GET', 'flickr.photos.getContactsPublicPhotos', args);
};

/**
 * flickr.photos.getContext
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.getContext.html
 */

Flickr.prototype.photos.getContext = function (args) {
	validate(args, 'photo_id');
	return this._('GET', 'flickr.photos.getContext', args);
};

/**
 * flickr.photos.getCounts
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.getCounts.html
 */

Flickr.prototype.photos.getCounts = function (args) {
	return this._('GET', 'flickr.photos.getCounts', args);
};

/**
 * flickr.photos.getExif
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.getExif.html
 */

Flickr.prototype.photos.getExif = function (args) {
	validate(args, 'photo_id');
	return this._('GET', 'flickr.photos.getExif', args);
};

/**
 * flickr.photos.getFavorites
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.getFavorites.html
 */

Flickr.prototype.photos.getFavorites = function (args) {
	validate(args, 'photo_id');
	return this._('GET', 'flickr.photos.getFavorites', args);
};

/**
 * flickr.photos.getInfo
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.getInfo.html
 */

Flickr.prototype.photos.getInfo = function (args) {
	validate(args, 'photo_id');
	return this._('GET', 'flickr.photos.getInfo', args);
};

/**
 * flickr.photos.getNotInSet
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.getNotInSet.html
 */

Flickr.prototype.photos.getNotInSet = function (args) {
	return this._('GET', 'flickr.photos.getNotInSet', args);
};

/**
 * flickr.photos.getPerms
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.getPerms.html
 */

Flickr.prototype.photos.getPerms = function (args) {
	validate(args, 'photo_id');
	return this._('GET', 'flickr.photos.getPerms', args);
};

/**
 * flickr.photos.getPopular
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.getPopular.html
 */

Flickr.prototype.photos.getPopular = function (args) {
	return this._('GET', 'flickr.photos.getPopular', args);
};

/**
 * flickr.photos.getRecent
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.getRecent.html
 */

Flickr.prototype.photos.getRecent = function (args) {
	return this._('GET', 'flickr.photos.getRecent', args);
};

/**
 * flickr.photos.getSizes
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.getSizes.html
 */

Flickr.prototype.photos.getSizes = function (args) {
	validate(args, 'photo_id');
	return this._('GET', 'flickr.photos.getSizes', args);
};

/**
 * flickr.photos.getUntagged
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.getUntagged.html
 */

Flickr.prototype.photos.getUntagged = function (args) {
	return this._('GET', 'flickr.photos.getUntagged', args);
};

/**
 * flickr.photos.getWithGeoData
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.getWithGeoData.html
 */

Flickr.prototype.photos.getWithGeoData = function (args) {
	return this._('GET', 'flickr.photos.getWithGeoData', args);
};

/**
 * flickr.photos.getWithoutGeoData
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.getWithoutGeoData.html
 */

Flickr.prototype.photos.getWithoutGeoData = function (args) {
	return this._('GET', 'flickr.photos.getWithoutGeoData', args);
};

/**
 * flickr.photos.recentlyUpdated
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.recentlyUpdated.html
 */

Flickr.prototype.photos.recentlyUpdated = function (args) {
	validate(args, 'min_date');
	return this._('GET', 'flickr.photos.recentlyUpdated', args);
};

/**
 * flickr.photos.removeTag
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.removeTag.html
 */

Flickr.prototype.photos.removeTag = function (args) {
	validate(args, 'tag_id');
	return this._('POST', 'flickr.photos.removeTag', args);
};

/**
 * flickr.photos.search
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.search.html
 */

Flickr.prototype.photos.search = function (args) {
	return this._('GET', 'flickr.photos.search', args);
};

/**
 * flickr.photos.setContentType
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.setContentType.html
 */

Flickr.prototype.photos.setContentType = function (args) {
	validate(args, 'photo_id');
	validate(args, 'content_type');
	return this._('POST', 'flickr.photos.setContentType', args);
};

/**
 * flickr.photos.setDates
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.setDates.html
 */

Flickr.prototype.photos.setDates = function (args) {
	validate(args, 'photo_id');
	return this._('POST', 'flickr.photos.setDates', args);
};

/**
 * flickr.photos.setMeta
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.setMeta.html
 */

Flickr.prototype.photos.setMeta = function (args) {
	validate(args, 'photo_id');
	return this._('POST', 'flickr.photos.setMeta', args);
};

/**
 * flickr.photos.setPerms
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.setPerms.html
 */

Flickr.prototype.photos.setPerms = function (args) {
	validate(args, 'photo_id');
	validate(args, 'is_public');
	validate(args, 'is_friend');
	validate(args, 'is_family');
	return this._('POST', 'flickr.photos.setPerms', args);
};

/**
 * flickr.photos.setSafetyLevel
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.setSafetyLevel.html
 */

Flickr.prototype.photos.setSafetyLevel = function (args) {
	validate(args, 'photo_id');
	return this._('POST', 'flickr.photos.setSafetyLevel', args);
};

/**
 * flickr.photos.setTags
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.setTags.html
 */

Flickr.prototype.photos.setTags = function (args) {
	validate(args, 'photo_id');
	validate(args, 'tags');
	return this._('POST', 'flickr.photos.setTags', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.photos.comments = {};

/**
 * flickr.photos.comments.addComment
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.comments.addComment.html
 */

Flickr.prototype.photos.comments.addComment = function (args) {
	validate(args, 'photo_id');
	validate(args, 'comment_text');
	return this._('POST', 'flickr.photos.comments.addComment', args);
};

/**
 * flickr.photos.comments.deleteComment
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.comments.deleteComment.html
 */

Flickr.prototype.photos.comments.deleteComment = function (args) {
	validate(args, 'comment_id');
	return this._('POST', 'flickr.photos.comments.deleteComment', args);
};

/**
 * flickr.photos.comments.editComment
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.comments.editComment.html
 */

Flickr.prototype.photos.comments.editComment = function (args) {
	validate(args, 'comment_id');
	validate(args, 'comment_text');
	return this._('POST', 'flickr.photos.comments.editComment', args);
};

/**
 * flickr.photos.comments.getList
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.comments.getList.html
 */

Flickr.prototype.photos.comments.getList = function (args) {
	validate(args, 'photo_id');
	return this._('GET', 'flickr.photos.comments.getList', args);
};

/**
 * flickr.photos.comments.getRecentForContacts
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.comments.getRecentForContacts.html
 */

Flickr.prototype.photos.comments.getRecentForContacts = function (args) {
	return this._('GET', 'flickr.photos.comments.getRecentForContacts', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.photos.geo = {};

/**
 * flickr.photos.geo.batchCorrectLocation
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.geo.batchCorrectLocation.html
 */

Flickr.prototype.photos.geo.batchCorrectLocation = function (args) {
	validate(args, 'lat');
	validate(args, 'lon');
	validate(args, 'accuracy');
	return this._('POST', 'flickr.photos.geo.batchCorrectLocation', args);
};

/**
 * flickr.photos.geo.correctLocation
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.geo.correctLocation.html
 */

Flickr.prototype.photos.geo.correctLocation = function (args) {
	validate(args, 'photo_id');
	validate(args, 'foursquare_id');
	return this._('POST', 'flickr.photos.geo.correctLocation', args);
};

/**
 * flickr.photos.geo.getLocation
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.geo.getLocation.html
 */

Flickr.prototype.photos.geo.getLocation = function (args) {
	validate(args, 'photo_id');
	return this._('GET', 'flickr.photos.geo.getLocation', args);
};

/**
 * flickr.photos.geo.getPerms
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.geo.getPerms.html
 */

Flickr.prototype.photos.geo.getPerms = function (args) {
	validate(args, 'photo_id');
	return this._('GET', 'flickr.photos.geo.getPerms', args);
};

/**
 * flickr.photos.geo.photosForLocation
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.geo.photosForLocation.html
 */

Flickr.prototype.photos.geo.photosForLocation = function (args) {
	validate(args, 'lat');
	validate(args, 'lon');
	return this._('GET', 'flickr.photos.geo.photosForLocation', args);
};

/**
 * flickr.photos.geo.removeLocation
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.geo.removeLocation.html
 */

Flickr.prototype.photos.geo.removeLocation = function (args) {
	validate(args, 'photo_id');
	return this._('POST', 'flickr.photos.geo.removeLocation', args);
};

/**
 * flickr.photos.geo.setContext
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.geo.setContext.html
 */

Flickr.prototype.photos.geo.setContext = function (args) {
	validate(args, 'photo_id');
	validate(args, 'context');
	return this._('POST', 'flickr.photos.geo.setContext', args);
};

/**
 * flickr.photos.geo.setLocation
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.geo.setLocation.html
 */

Flickr.prototype.photos.geo.setLocation = function (args) {
	validate(args, 'photo_id');
	validate(args, 'lat');
	validate(args, 'lon');
	return this._('POST', 'flickr.photos.geo.setLocation', args);
};

/**
 * flickr.photos.geo.setPerms
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.geo.setPerms.html
 */

Flickr.prototype.photos.geo.setPerms = function (args) {
	validate(args, 'is_public');
	validate(args, 'is_contact');
	validate(args, 'is_friend');
	validate(args, 'is_family');
	validate(args, 'photo_id');
	return this._('POST', 'flickr.photos.geo.setPerms', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.photos.licenses = {};

/**
 * flickr.photos.licenses.getInfo
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.licenses.getInfo.html
 */

Flickr.prototype.photos.licenses.getInfo = function (args) {
	return this._('GET', 'flickr.photos.licenses.getInfo', args);
};

/**
 * flickr.photos.licenses.setLicense
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.licenses.setLicense.html
 */

Flickr.prototype.photos.licenses.setLicense = function (args) {
	validate(args, 'photo_id');
	validate(args, 'license_id');
	return this._('POST', 'flickr.photos.licenses.setLicense', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.photos.notes = {};

/**
 * flickr.photos.notes.add
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.notes.add.html
 */

Flickr.prototype.photos.notes.add = function (args) {
	validate(args, 'photo_id');
	validate(args, 'note_x');
	validate(args, 'note_y');
	validate(args, 'note_w');
	validate(args, 'note_h');
	validate(args, 'note_text');
	return this._('POST', 'flickr.photos.notes.add', args);
};

/**
 * flickr.photos.notes.delete
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.notes.delete.html
 */

Flickr.prototype.photos.notes.delete = function (args) {
	validate(args, 'note_id');
	return this._('POST', 'flickr.photos.notes.delete', args);
};

/**
 * flickr.photos.notes.edit
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.notes.edit.html
 */

Flickr.prototype.photos.notes.edit = function (args) {
	validate(args, 'note_id');
	validate(args, 'note_x');
	validate(args, 'note_y');
	validate(args, 'note_w');
	validate(args, 'note_h');
	validate(args, 'note_text');
	return this._('POST', 'flickr.photos.notes.edit', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.photos.people = {};

/**
 * flickr.photos.people.add
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.people.add.html
 */

Flickr.prototype.photos.people.add = function (args) {
	validate(args, 'photo_id');
	validate(args, 'user_id');
	return this._('POST', 'flickr.photos.people.add', args);
};

/**
 * flickr.photos.people.delete
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.people.delete.html
 */

Flickr.prototype.photos.people.delete = function (args) {
	validate(args, 'photo_id');
	validate(args, 'user_id');
	return this._('POST', 'flickr.photos.people.delete', args);
};

/**
 * flickr.photos.people.deleteCoords
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.people.deleteCoords.html
 */

Flickr.prototype.photos.people.deleteCoords = function (args) {
	validate(args, 'photo_id');
	validate(args, 'user_id');
	return this._('POST', 'flickr.photos.people.deleteCoords', args);
};

/**
 * flickr.photos.people.editCoords
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.people.editCoords.html
 */

Flickr.prototype.photos.people.editCoords = function (args) {
	validate(args, 'photo_id');
	validate(args, 'user_id');
	validate(args, 'person_x');
	validate(args, 'person_y');
	validate(args, 'person_w');
	validate(args, 'person_h');
	return this._('POST', 'flickr.photos.people.editCoords', args);
};

/**
 * flickr.photos.people.getList
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.people.getList.html
 */

Flickr.prototype.photos.people.getList = function (args) {
	validate(args, 'photo_id');
	return this._('GET', 'flickr.photos.people.getList', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.photos.suggestions = {};

/**
 * flickr.photos.suggestions.approveSuggestion
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.suggestions.approveSuggestion.html
 */

Flickr.prototype.photos.suggestions.approveSuggestion = function (args) {
	validate(args, 'suggestion_id');
	return this._('POST', 'flickr.photos.suggestions.approveSuggestion', args);
};

/**
 * flickr.photos.suggestions.getList
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.suggestions.getList.html
 */

Flickr.prototype.photos.suggestions.getList = function (args) {
	return this._('GET', 'flickr.photos.suggestions.getList', args);
};

/**
 * flickr.photos.suggestions.rejectSuggestion
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.suggestions.rejectSuggestion.html
 */

Flickr.prototype.photos.suggestions.rejectSuggestion = function (args) {
	validate(args, 'suggestion_id');
	return this._('POST', 'flickr.photos.suggestions.rejectSuggestion', args);
};

/**
 * flickr.photos.suggestions.removeSuggestion
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.suggestions.removeSuggestion.html
 */

Flickr.prototype.photos.suggestions.removeSuggestion = function (args) {
	validate(args, 'suggestion_id');
	return this._('POST', 'flickr.photos.suggestions.removeSuggestion', args);
};

/**
 * flickr.photos.suggestions.suggestLocation
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.suggestions.suggestLocation.html
 */

Flickr.prototype.photos.suggestions.suggestLocation = function (args) {
	validate(args, 'photo_id');
	validate(args, 'lat');
	validate(args, 'lon');
	return this._('POST', 'flickr.photos.suggestions.suggestLocation', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.photos.transform = {};

/**
 * flickr.photos.transform.rotate
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.transform.rotate.html
 */

Flickr.prototype.photos.transform.rotate = function (args) {
	validate(args, 'photo_id');
	validate(args, 'degrees');
	return this._('POST', 'flickr.photos.transform.rotate', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.photos.upload = {};

/**
 * flickr.photos.upload.checkTickets
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photos.upload.checkTickets.html
 */

Flickr.prototype.photos.upload.checkTickets = function (args) {
	validate(args, 'tickets');
	return this._('GET', 'flickr.photos.upload.checkTickets', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.photosets = {};

/**
 * flickr.photosets.addPhoto
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photosets.addPhoto.html
 */

Flickr.prototype.photosets.addPhoto = function (args) {
	validate(args, 'photoset_id');
	validate(args, 'photo_id');
	return this._('POST', 'flickr.photosets.addPhoto', args);
};

/**
 * flickr.photosets.create
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photosets.create.html
 */

Flickr.prototype.photosets.create = function (args) {
	validate(args, 'title');
	validate(args, 'primary_photo_id');
	return this._('POST', 'flickr.photosets.create', args);
};

/**
 * flickr.photosets.delete
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photosets.delete.html
 */

Flickr.prototype.photosets.delete = function (args) {
	validate(args, 'photoset_id');
	return this._('POST', 'flickr.photosets.delete', args);
};

/**
 * flickr.photosets.editMeta
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photosets.editMeta.html
 */

Flickr.prototype.photosets.editMeta = function (args) {
	validate(args, 'photoset_id');
	validate(args, 'title');
	return this._('POST', 'flickr.photosets.editMeta', args);
};

/**
 * flickr.photosets.editPhotos
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photosets.editPhotos.html
 */

Flickr.prototype.photosets.editPhotos = function (args) {
	validate(args, 'photoset_id');
	validate(args, 'primary_photo_id');
	validate(args, 'photo_ids');
	return this._('POST', 'flickr.photosets.editPhotos', args);
};

/**
 * flickr.photosets.getContext
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photosets.getContext.html
 */

Flickr.prototype.photosets.getContext = function (args) {
	validate(args, 'photo_id');
	validate(args, 'photoset_id');
	return this._('GET', 'flickr.photosets.getContext', args);
};

/**
 * flickr.photosets.getInfo
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photosets.getInfo.html
 */

Flickr.prototype.photosets.getInfo = function (args) {
	validate(args, 'photoset_id');
	validate(args, 'user_id');
	return this._('GET', 'flickr.photosets.getInfo', args);
};

/**
 * flickr.photosets.getList
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photosets.getList.html
 */

Flickr.prototype.photosets.getList = function (args) {
	return this._('GET', 'flickr.photosets.getList', args);
};

/**
 * flickr.photosets.getPhotos
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photosets.getPhotos.html
 */

Flickr.prototype.photosets.getPhotos = function (args) {
	validate(args, 'photoset_id');
	validate(args, 'user_id');
	return this._('GET', 'flickr.photosets.getPhotos', args);
};

/**
 * flickr.photosets.orderSets
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photosets.orderSets.html
 */

Flickr.prototype.photosets.orderSets = function (args) {
	validate(args, 'photoset_ids');
	return this._('POST', 'flickr.photosets.orderSets', args);
};

/**
 * flickr.photosets.removePhoto
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photosets.removePhoto.html
 */

Flickr.prototype.photosets.removePhoto = function (args) {
	validate(args, 'photoset_id');
	validate(args, 'photo_id');
	return this._('POST', 'flickr.photosets.removePhoto', args);
};

/**
 * flickr.photosets.removePhotos
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photosets.removePhotos.html
 */

Flickr.prototype.photosets.removePhotos = function (args) {
	validate(args, 'photoset_id');
	validate(args, 'photo_ids');
	return this._('POST', 'flickr.photosets.removePhotos', args);
};

/**
 * flickr.photosets.reorderPhotos
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photosets.reorderPhotos.html
 */

Flickr.prototype.photosets.reorderPhotos = function (args) {
	validate(args, 'photoset_id');
	validate(args, 'photo_ids');
	return this._('POST', 'flickr.photosets.reorderPhotos', args);
};

/**
 * flickr.photosets.setPrimaryPhoto
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photosets.setPrimaryPhoto.html
 */

Flickr.prototype.photosets.setPrimaryPhoto = function (args) {
	validate(args, 'photoset_id');
	validate(args, 'photo_id');
	return this._('POST', 'flickr.photosets.setPrimaryPhoto', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.photosets.comments = {};

/**
 * flickr.photosets.comments.addComment
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photosets.comments.addComment.html
 */

Flickr.prototype.photosets.comments.addComment = function (args) {
	validate(args, 'photoset_id');
	validate(args, 'comment_text');
	return this._('POST', 'flickr.photosets.comments.addComment', args);
};

/**
 * flickr.photosets.comments.deleteComment
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photosets.comments.deleteComment.html
 */

Flickr.prototype.photosets.comments.deleteComment = function (args) {
	validate(args, 'comment_id');
	return this._('POST', 'flickr.photosets.comments.deleteComment', args);
};

/**
 * flickr.photosets.comments.editComment
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photosets.comments.editComment.html
 */

Flickr.prototype.photosets.comments.editComment = function (args) {
	validate(args, 'comment_id');
	validate(args, 'comment_text');
	return this._('POST', 'flickr.photosets.comments.editComment', args);
};

/**
 * flickr.photosets.comments.getList
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.photosets.comments.getList.html
 */

Flickr.prototype.photosets.comments.getList = function (args) {
	validate(args, 'photoset_id');
	return this._('GET', 'flickr.photosets.comments.getList', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.places = {};

/**
 * flickr.places.find
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.places.find.html
 */

Flickr.prototype.places.find = function (args) {
	validate(args, 'query');
	return this._('GET', 'flickr.places.find', args);
};

/**
 * flickr.places.findByLatLon
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.places.findByLatLon.html
 */

Flickr.prototype.places.findByLatLon = function (args) {
	validate(args, 'lat');
	validate(args, 'lon');
	return this._('GET', 'flickr.places.findByLatLon', args);
};

/**
 * flickr.places.getChildrenWithPhotosPublic
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.places.getChildrenWithPhotosPublic.html
 */

Flickr.prototype.places.getChildrenWithPhotosPublic = function (args) {
	return this._('GET', 'flickr.places.getChildrenWithPhotosPublic', args);
};

/**
 * flickr.places.getInfo
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.places.getInfo.html
 */

Flickr.prototype.places.getInfo = function (args) {
	return this._('GET', 'flickr.places.getInfo', args);
};

/**
 * flickr.places.getInfoByUrl
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.places.getInfoByUrl.html
 */

Flickr.prototype.places.getInfoByUrl = function (args) {
	validate(args, 'url');
	return this._('GET', 'flickr.places.getInfoByUrl', args);
};

/**
 * flickr.places.getPlaceTypes
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.places.getPlaceTypes.html
 */

Flickr.prototype.places.getPlaceTypes = function (args) {
	return this._('GET', 'flickr.places.getPlaceTypes', args);
};

/**
 * flickr.places.getShapeHistory
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.places.getShapeHistory.html
 */

Flickr.prototype.places.getShapeHistory = function (args) {
	return this._('GET', 'flickr.places.getShapeHistory', args);
};

/**
 * flickr.places.getTopPlacesList
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.places.getTopPlacesList.html
 */

Flickr.prototype.places.getTopPlacesList = function (args) {
	validate(args, 'place_type_id');
	return this._('GET', 'flickr.places.getTopPlacesList', args);
};

/**
 * flickr.places.placesForBoundingBox
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.places.placesForBoundingBox.html
 */

Flickr.prototype.places.placesForBoundingBox = function (args) {
	validate(args, 'bbox');
	return this._('GET', 'flickr.places.placesForBoundingBox', args);
};

/**
 * flickr.places.placesForContacts
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.places.placesForContacts.html
 */

Flickr.prototype.places.placesForContacts = function (args) {
	return this._('GET', 'flickr.places.placesForContacts', args);
};

/**
 * flickr.places.placesForTags
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.places.placesForTags.html
 */

Flickr.prototype.places.placesForTags = function (args) {
	validate(args, 'place_type_id');
	return this._('GET', 'flickr.places.placesForTags', args);
};

/**
 * flickr.places.placesForUser
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.places.placesForUser.html
 */

Flickr.prototype.places.placesForUser = function (args) {
	return this._('GET', 'flickr.places.placesForUser', args);
};

/**
 * flickr.places.resolvePlaceId
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.places.resolvePlaceId.html
 */

Flickr.prototype.places.resolvePlaceId = function (args) {
	validate(args, 'place_id');
	return this._('GET', 'flickr.places.resolvePlaceId', args);
};

/**
 * flickr.places.resolvePlaceURL
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.places.resolvePlaceURL.html
 */

Flickr.prototype.places.resolvePlaceURL = function (args) {
	validate(args, 'url');
	return this._('GET', 'flickr.places.resolvePlaceURL', args);
};

/**
 * flickr.places.tagsForPlace
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.places.tagsForPlace.html
 */

Flickr.prototype.places.tagsForPlace = function (args) {
	return this._('GET', 'flickr.places.tagsForPlace', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.prefs = {};

/**
 * flickr.prefs.getContentType
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.prefs.getContentType.html
 */

Flickr.prototype.prefs.getContentType = function (args) {
	return this._('GET', 'flickr.prefs.getContentType', args);
};

/**
 * flickr.prefs.getGeoPerms
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.prefs.getGeoPerms.html
 */

Flickr.prototype.prefs.getGeoPerms = function (args) {
	return this._('GET', 'flickr.prefs.getGeoPerms', args);
};

/**
 * flickr.prefs.getHidden
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.prefs.getHidden.html
 */

Flickr.prototype.prefs.getHidden = function (args) {
	return this._('GET', 'flickr.prefs.getHidden', args);
};

/**
 * flickr.prefs.getPrivacy
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.prefs.getPrivacy.html
 */

Flickr.prototype.prefs.getPrivacy = function (args) {
	return this._('GET', 'flickr.prefs.getPrivacy', args);
};

/**
 * flickr.prefs.getSafetyLevel
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.prefs.getSafetyLevel.html
 */

Flickr.prototype.prefs.getSafetyLevel = function (args) {
	return this._('GET', 'flickr.prefs.getSafetyLevel', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.profile = {};

/**
 * flickr.profile.getProfile
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.profile.getProfile.html
 */

Flickr.prototype.profile.getProfile = function (args) {
	validate(args, 'user_id');
	return this._('GET', 'flickr.profile.getProfile', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.push = {};

/**
 * flickr.push.getSubscriptions
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.push.getSubscriptions.html
 */

Flickr.prototype.push.getSubscriptions = function (args) {
	return this._('GET', 'flickr.push.getSubscriptions', args);
};

/**
 * flickr.push.getTopics
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.push.getTopics.html
 */

Flickr.prototype.push.getTopics = function (args) {
	return this._('GET', 'flickr.push.getTopics', args);
};

/**
 * flickr.push.subscribe
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.push.subscribe.html
 */

Flickr.prototype.push.subscribe = function (args) {
	validate(args, 'topic');
	validate(args, 'callback');
	validate(args, 'verify');
	return this._('GET', 'flickr.push.subscribe', args);
};

/**
 * flickr.push.unsubscribe
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.push.unsubscribe.html
 */

Flickr.prototype.push.unsubscribe = function (args) {
	validate(args, 'topic');
	validate(args, 'callback');
	validate(args, 'verify');
	return this._('GET', 'flickr.push.unsubscribe', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.reflection = {};

/**
 * flickr.reflection.getMethodInfo
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.reflection.getMethodInfo.html
 */

Flickr.prototype.reflection.getMethodInfo = function (args) {
	validate(args, 'method_name');
	return this._('GET', 'flickr.reflection.getMethodInfo', args);
};

/**
 * flickr.reflection.getMethods
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.reflection.getMethods.html
 */

Flickr.prototype.reflection.getMethods = function (args) {
	return this._('GET', 'flickr.reflection.getMethods', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.stats = {};

/**
 * flickr.stats.getCSVFiles
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.stats.getCSVFiles.html
 */

Flickr.prototype.stats.getCSVFiles = function (args) {
	return this._('GET', 'flickr.stats.getCSVFiles', args);
};

/**
 * flickr.stats.getCollectionDomains
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.stats.getCollectionDomains.html
 */

Flickr.prototype.stats.getCollectionDomains = function (args) {
	validate(args, 'date');
	return this._('GET', 'flickr.stats.getCollectionDomains', args);
};

/**
 * flickr.stats.getCollectionReferrers
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.stats.getCollectionReferrers.html
 */

Flickr.prototype.stats.getCollectionReferrers = function (args) {
	validate(args, 'date');
	validate(args, 'domain');
	return this._('GET', 'flickr.stats.getCollectionReferrers', args);
};

/**
 * flickr.stats.getCollectionStats
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.stats.getCollectionStats.html
 */

Flickr.prototype.stats.getCollectionStats = function (args) {
	validate(args, 'date');
	validate(args, 'collection_id');
	return this._('GET', 'flickr.stats.getCollectionStats', args);
};

/**
 * flickr.stats.getPhotoDomains
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.stats.getPhotoDomains.html
 */

Flickr.prototype.stats.getPhotoDomains = function (args) {
	validate(args, 'date');
	return this._('GET', 'flickr.stats.getPhotoDomains', args);
};

/**
 * flickr.stats.getPhotoReferrers
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.stats.getPhotoReferrers.html
 */

Flickr.prototype.stats.getPhotoReferrers = function (args) {
	validate(args, 'date');
	validate(args, 'domain');
	return this._('GET', 'flickr.stats.getPhotoReferrers', args);
};

/**
 * flickr.stats.getPhotoStats
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.stats.getPhotoStats.html
 */

Flickr.prototype.stats.getPhotoStats = function (args) {
	validate(args, 'date');
	validate(args, 'photo_id');
	return this._('GET', 'flickr.stats.getPhotoStats', args);
};

/**
 * flickr.stats.getPhotosetDomains
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.stats.getPhotosetDomains.html
 */

Flickr.prototype.stats.getPhotosetDomains = function (args) {
	validate(args, 'date');
	return this._('GET', 'flickr.stats.getPhotosetDomains', args);
};

/**
 * flickr.stats.getPhotosetReferrers
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.stats.getPhotosetReferrers.html
 */

Flickr.prototype.stats.getPhotosetReferrers = function (args) {
	validate(args, 'date');
	validate(args, 'domain');
	return this._('GET', 'flickr.stats.getPhotosetReferrers', args);
};

/**
 * flickr.stats.getPhotosetStats
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.stats.getPhotosetStats.html
 */

Flickr.prototype.stats.getPhotosetStats = function (args) {
	validate(args, 'date');
	validate(args, 'photoset_id');
	return this._('GET', 'flickr.stats.getPhotosetStats', args);
};

/**
 * flickr.stats.getPhotostreamDomains
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.stats.getPhotostreamDomains.html
 */

Flickr.prototype.stats.getPhotostreamDomains = function (args) {
	validate(args, 'date');
	return this._('GET', 'flickr.stats.getPhotostreamDomains', args);
};

/**
 * flickr.stats.getPhotostreamReferrers
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.stats.getPhotostreamReferrers.html
 */

Flickr.prototype.stats.getPhotostreamReferrers = function (args) {
	validate(args, 'date');
	validate(args, 'domain');
	return this._('GET', 'flickr.stats.getPhotostreamReferrers', args);
};

/**
 * flickr.stats.getPhotostreamStats
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.stats.getPhotostreamStats.html
 */

Flickr.prototype.stats.getPhotostreamStats = function (args) {
	validate(args, 'date');
	return this._('GET', 'flickr.stats.getPhotostreamStats', args);
};

/**
 * flickr.stats.getPopularPhotos
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.stats.getPopularPhotos.html
 */

Flickr.prototype.stats.getPopularPhotos = function (args) {
	return this._('GET', 'flickr.stats.getPopularPhotos', args);
};

/**
 * flickr.stats.getTotalViews
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.stats.getTotalViews.html
 */

Flickr.prototype.stats.getTotalViews = function (args) {
	return this._('GET', 'flickr.stats.getTotalViews', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.tags = {};

/**
 * flickr.tags.getClusterPhotos
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.tags.getClusterPhotos.html
 */

Flickr.prototype.tags.getClusterPhotos = function (args) {
	validate(args, 'tag');
	validate(args, 'cluster_id');
	return this._('GET', 'flickr.tags.getClusterPhotos', args);
};

/**
 * flickr.tags.getClusters
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.tags.getClusters.html
 */

Flickr.prototype.tags.getClusters = function (args) {
	validate(args, 'tag');
	return this._('GET', 'flickr.tags.getClusters', args);
};

/**
 * flickr.tags.getHotList
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.tags.getHotList.html
 */

Flickr.prototype.tags.getHotList = function (args) {
	return this._('GET', 'flickr.tags.getHotList', args);
};

/**
 * flickr.tags.getListPhoto
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.tags.getListPhoto.html
 */

Flickr.prototype.tags.getListPhoto = function (args) {
	validate(args, 'photo_id');
	return this._('GET', 'flickr.tags.getListPhoto', args);
};

/**
 * flickr.tags.getListUser
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.tags.getListUser.html
 */

Flickr.prototype.tags.getListUser = function (args) {
	return this._('GET', 'flickr.tags.getListUser', args);
};

/**
 * flickr.tags.getListUserPopular
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.tags.getListUserPopular.html
 */

Flickr.prototype.tags.getListUserPopular = function (args) {
	return this._('GET', 'flickr.tags.getListUserPopular', args);
};

/**
 * flickr.tags.getListUserRaw
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.tags.getListUserRaw.html
 */

Flickr.prototype.tags.getListUserRaw = function (args) {
	return this._('GET', 'flickr.tags.getListUserRaw', args);
};

/**
 * flickr.tags.getMostFrequentlyUsed
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.tags.getMostFrequentlyUsed.html
 */

Flickr.prototype.tags.getMostFrequentlyUsed = function (args) {
	return this._('GET', 'flickr.tags.getMostFrequentlyUsed', args);
};

/**
 * flickr.tags.getRelated
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.tags.getRelated.html
 */

Flickr.prototype.tags.getRelated = function (args) {
	validate(args, 'tag');
	return this._('GET', 'flickr.tags.getRelated', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.test = {};

/**
 * flickr.test.echo
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.test.echo.html
 */

Flickr.prototype.test.echo = function (args) {
	return this._('GET', 'flickr.test.echo', args);
};

/**
 * flickr.test.login
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.test.login.html
 */

Flickr.prototype.test.login = function (args) {
	return this._('GET', 'flickr.test.login', args);
};

/**
 * flickr.test.null
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.test.null.html
 */

Flickr.prototype.test.null = function (args) {
	return this._('GET', 'flickr.test.null', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.testimonials = {};

/**
 * flickr.testimonials.addTestimonial
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.testimonials.addTestimonial.html
 */

Flickr.prototype.testimonials.addTestimonial = function (args) {
	validate(args, 'user_id');
	validate(args, 'testimonial_text');
	return this._('POST', 'flickr.testimonials.addTestimonial', args);
};

/**
 * flickr.testimonials.approveTestimonial
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.testimonials.approveTestimonial.html
 */

Flickr.prototype.testimonials.approveTestimonial = function (args) {
	validate(args, 'testimonial_id');
	return this._('POST', 'flickr.testimonials.approveTestimonial', args);
};

/**
 * flickr.testimonials.deleteTestimonial
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.testimonials.deleteTestimonial.html
 */

Flickr.prototype.testimonials.deleteTestimonial = function (args) {
	validate(args, 'testimonial_id');
	return this._('POST', 'flickr.testimonials.deleteTestimonial', args);
};

/**
 * flickr.testimonials.editTestimonial
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.testimonials.editTestimonial.html
 */

Flickr.prototype.testimonials.editTestimonial = function (args) {
	validate(args, 'user_id');
	validate(args, 'testimonial_id');
	validate(args, 'testimonial_text');
	return this._('POST', 'flickr.testimonials.editTestimonial', args);
};

/**
 * flickr.testimonials.getAllTestimonialsAbout
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.testimonials.getAllTestimonialsAbout.html
 */

Flickr.prototype.testimonials.getAllTestimonialsAbout = function (args) {
	return this._('GET', 'flickr.testimonials.getAllTestimonialsAbout', args);
};

/**
 * flickr.testimonials.getAllTestimonialsAboutBy
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.testimonials.getAllTestimonialsAboutBy.html
 */

Flickr.prototype.testimonials.getAllTestimonialsAboutBy = function (args) {
	validate(args, 'user_id');
	return this._('GET', 'flickr.testimonials.getAllTestimonialsAboutBy', args);
};

/**
 * flickr.testimonials.getAllTestimonialsBy
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.testimonials.getAllTestimonialsBy.html
 */

Flickr.prototype.testimonials.getAllTestimonialsBy = function (args) {
	return this._('GET', 'flickr.testimonials.getAllTestimonialsBy', args);
};

/**
 * flickr.testimonials.getPendingTestimonialsAbout
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.testimonials.getPendingTestimonialsAbout.html
 */

Flickr.prototype.testimonials.getPendingTestimonialsAbout = function (args) {
	return this._('GET', 'flickr.testimonials.getPendingTestimonialsAbout', args);
};

/**
 * flickr.testimonials.getPendingTestimonialsAboutBy
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.testimonials.getPendingTestimonialsAboutBy.html
 */

Flickr.prototype.testimonials.getPendingTestimonialsAboutBy = function (args) {
	validate(args, 'user_id');
	return this._('GET', 'flickr.testimonials.getPendingTestimonialsAboutBy', args);
};

/**
 * flickr.testimonials.getPendingTestimonialsBy
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.testimonials.getPendingTestimonialsBy.html
 */

Flickr.prototype.testimonials.getPendingTestimonialsBy = function (args) {
	return this._('GET', 'flickr.testimonials.getPendingTestimonialsBy', args);
};

/**
 * flickr.testimonials.getTestimonialsAbout
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.testimonials.getTestimonialsAbout.html
 */

Flickr.prototype.testimonials.getTestimonialsAbout = function (args) {
	validate(args, 'user_id');
	return this._('GET', 'flickr.testimonials.getTestimonialsAbout', args);
};

/**
 * flickr.testimonials.getTestimonialsAboutBy
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.testimonials.getTestimonialsAboutBy.html
 */

Flickr.prototype.testimonials.getTestimonialsAboutBy = function (args) {
	validate(args, 'user_id');
	return this._('GET', 'flickr.testimonials.getTestimonialsAboutBy', args);
};

/**
 * flickr.testimonials.getTestimonialsBy
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.testimonials.getTestimonialsBy.html
 */

Flickr.prototype.testimonials.getTestimonialsBy = function (args) {
	validate(args, 'user_id');
	return this._('GET', 'flickr.testimonials.getTestimonialsBy', args);
};

/**
 * @type {Object}
 * @ignore
 */

Flickr.prototype.urls = {};

/**
 * flickr.urls.getGroup
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.urls.getGroup.html
 */

Flickr.prototype.urls.getGroup = function (args) {
	validate(args, 'group_id');
	return this._('GET', 'flickr.urls.getGroup', args);
};

/**
 * flickr.urls.getUserPhotos
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.urls.getUserPhotos.html
 */

Flickr.prototype.urls.getUserPhotos = function (args) {
	return this._('GET', 'flickr.urls.getUserPhotos', args);
};

/**
 * flickr.urls.getUserProfile
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.urls.getUserProfile.html
 */

Flickr.prototype.urls.getUserProfile = function (args) {
	return this._('GET', 'flickr.urls.getUserProfile', args);
};

/**
 * flickr.urls.lookupGallery
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.urls.lookupGallery.html
 */

Flickr.prototype.urls.lookupGallery = function (args) {
	validate(args, 'url');
	return this._('GET', 'flickr.urls.lookupGallery', args);
};

/**
 * flickr.urls.lookupGroup
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.urls.lookupGroup.html
 */

Flickr.prototype.urls.lookupGroup = function (args) {
	validate(args, 'url');
	return this._('GET', 'flickr.urls.lookupGroup', args);
};

/**
 * flickr.urls.lookupUser
 * @param {Object} [args]
 * @returns {Request}
 * @ignore
 * @see https://www.flickr.com/services/api/flickr.urls.lookupUser.html
 */

Flickr.prototype.urls.lookupUser = function (args) {
	validate(args, 'url');
	return this._('GET', 'flickr.urls.lookupUser', args);
};


module.exports = Flickr;
