//calculateExperience.js
export const calculateExperience = (joiningDate) => {
    const now = new Date();
    const join = new Date(joiningDate);
  
    let years = now.getFullYear() - join.getFullYear();
    let months = now.getMonth() - join.getMonth();
  
    if (months < 0) {
      years--;
      months += 12;
    }
  
    return `${years} year(s), ${months} month(s)`;
  };
  