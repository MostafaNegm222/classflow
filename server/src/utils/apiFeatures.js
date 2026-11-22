// Reusable query helpers for any list endpoint: filter, search, sort, field selection, pagination.
class ApiFeatures {
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
  }

  // ?role=trainee&rating[gte]=4 -> { role: "trainee", rating: { $gte: 4 } }
  filter() {
    const params = { ...this.queryString };
    ["page", "sort", "limit", "fields", "search"].forEach((key) => delete params[key]);
    const mongoParams = JSON.parse(
      JSON.stringify(params).replace(/\b(gte|gt|lte|lt)\b/g, (op) => `$${op}`)
    );
    this.mongooseQuery = this.mongooseQuery.find(mongoParams);
    return this;
  }

  // ?search=mona -> case-insensitive match on the given fields; slug is always included.
  search(fields = []) {
    const keyword = this.queryString.search;
    if (keyword) {
      const regex = new RegExp(keyword, "i");
      this.mongooseQuery = this.mongooseQuery.find({
        $or: [...fields, "slug"].map((field) => ({ [field]: regex })),
      });
    }
    return this;
  }

  // ?sort=-createdAt,name
  sort() {
    const sortBy = this.queryString.sort
      ? this.queryString.sort.split(",").join(" ")
      : "-createdAt";
    this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    return this;
  }

  // ?fields=name,email
  limitFields() {
    if (this.queryString.fields) {
      this.mongooseQuery = this.mongooseQuery.select(this.queryString.fields.split(",").join(" "));
    }
    return this;
  }

  // ?page=2&limit=20
  paginate() {
    const page = Math.max(Number(this.queryString.page) || 1, 1);
    const limit = Math.max(Number(this.queryString.limit) || 20, 1);
    this.mongooseQuery = this.mongooseQuery.skip((page - 1) * limit).limit(limit);
    return this;
  }
}

module.exports = ApiFeatures;
