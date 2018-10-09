export class Rating {
  public _id;
  public userID;
  public ratingDescription;
  public subjectID;
  public editFlag = false;
  public username;
  public star;
  public created;

  constructor() {
    this._id = '';
    this.userID = '';
    this.ratingDescription = '';
    this.subjectID = '';
    this.editFlag = false;
    this.username = '';
    this.star = 0;
    this.created = '';
  }
}
