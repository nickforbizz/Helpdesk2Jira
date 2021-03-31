const getPagingData = (res, page, limit) => {
    const {
        count: totalItems,
        rows: data
    } = res;
    const currentPage = page ? +page : 0;
    const totalPages = Math.ceil(totalItems / limit);

    return {
        totalItems,
        data,
        totalPages,
        currentPage
    };
};


const getPagination = (page, size) => {
    const limit = size ? +size : 40;
    const offset = page ? page * limit : 0;

    return {
        limit,
        offset
    };
};

module.exports = {
    getPagination,
    getPagingData
}